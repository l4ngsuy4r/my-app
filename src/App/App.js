import React, { useEffect, useMemo } from "react";
import { useReducer } from "reinspect";
import Editor from "./Editor/Editor";
import List from "./List/List";

const filesURL = "https://re-back.herokuapp.com/files";
const headers = {
  "Accept": "application/json",
  "Content-Type": "application/json"
};

const timeoutMap = {};

const App = () => {
  const [state, dispatch] = useReducer(
    (state, { type, payload }) => {
      switch (type) {
        case "LOAD_SUCCESS": {
          const { fileList, fileMap } = payload;
          return { ...state, fileList, fileMap };
        }
        case "SET_ACTIVE": {
          const { fileId } = payload;
          return { ...state, activeFileId: fileId };
        }
        case "OPTIMISTIC_CREATE": {
          const { fileToCreate } = payload;
          return {
            ...state,
            fileList: [fileToCreate._id, ...state.fileList],
            fileMap: {
              ...state.fileMap,
              [fileToCreate._id]: fileToCreate
            },
            activeFileId: fileToCreate._id
          };
        }
        case "CREATE_FAIL": {
          const { fileId } = payload;
          return {
            ...state,
            fileList: state.fileList.filter(_id => _id !== fileId),
            fileMap: {
              ...state.fileMap,
              [fileId]: undefined
            }
          };
        }
        case "OPTIMISTIC_UPDATE": {
          const { fileToUpdate, oldValue } = payload;
          const prevOldValue = state.pendingUpdateMap[fileToUpdate._id];
          return {
            ...state,
            fileMap: {
              ...state.fileMap,
              [fileToUpdate._id]: fileToUpdate
            },
            pendingUpdateMap: {
              ...state.pendingUpdateMap,
              [fileToUpdate._id]: prevOldValue ? prevOldValue : oldValue
            }
          };
        }
        case "UPDATE_SUCCESS": {
          const { fileId } = payload;
          return {
            ...state,
            pendingUpdateMap: {
              ...state.pendingUpdateMap,
              [fileId]: undefined
            }
          };
        }
        case "UPDATE_FAIL": {
          const { fileId } = payload;
          return {
            ...state,
            fileMap: {
              ...state.fileMap,
              [fileId]: state.pendingUpdateMap[fileId]
            },
            pendingUpdateMap: {
              ...state.pendingUpdateMap,
              [fileId]: undefined
            }
          };
        }
        case "OPTIMISTIC_DELETE": {
          const { fileId, oldValue } = payload;
          return {
            ...state,
            activeFileId:
              state.activeFileId === fileId ? undefined : state.activeFileId,
            fileList: state.fileList.filter(_id => _id !== fileId),
            fileMap: {
              ...state.fileMap,
              [fileId]: undefined
            },
            pendingDeleteMap: {
              ...state.pendingDeleteMap,
              [fileId]: oldValue
            }
          };
        }
        case "DELETE_FAIL": {
          const { fileId } = payload;
          return {
            ...state,
            fileList: [...state.fileList, fileId],
            fileMap: {
              ...state.fileMap,
              [fileId]: state.pendingDeleteMap[fileId]
            },
            pendingDeleteMap: {
              ...state.pendingDeleteMap,
              [fileId]: undefined
            }
          };
        }
        default:
          return state;
      }
    },
    {
      fileList: [],
      fileMap: {},
      pendingUpdateMap: {},
      pendingDeleteMap: {}
    },
    "APP"
  );

  const activeFile = useMemo(() => state.fileMap[state.activeFileId], [
    state.fileMap,
    state.activeFileId
  ]);

  useMemo(() => {
    if (!state.activeFileId) {
      const fileId = state.fileList.sort((a, b) =>
        a > b ? -1 : a < b ? 1 : 0
      )[0];
      dispatch({ type: "SET_ACTIVE", payload: { fileId } });
    }
  }, [state.activeFileId, state.fileList]);

  useEffect(() => {
    fetch(filesURL)
      .then(res => res.json())
      .then(files =>
        dispatch({
          type: "LOAD_SUCCESS",
          payload: {
            fileList: files.map(file => file._id),
            fileMap: files.reduce((map, file) => {
              map[file._id] = file;
              return map;
            }, {})
          }
        })
      );
  }, []);

  const setActiveFileId = fileId =>
    dispatch({ type: "SET_ACTIVE", payload: { fileId } });

  const createFile = () => {
    const fileId = Date.now();
    const fileToCreate = { _id: fileId, title: "", body: "" };
    dispatch({
      type: "OPTIMISTIC_CREATE",
      payload: { fileToCreate }
    });
    fetch(filesURL, {
      method: "POST",
      body: JSON.stringify(fileToCreate),
      headers
    })
      .then(res => res.json())
      .then(
        () => {},
        () =>
          dispatch({
            type: "CREATE_FAIL",
            payload: { fileId }
          })
      );
  };

  const updateFile = fileToUpdate => {
    if (timeoutMap[fileToUpdate._id])
      clearTimeout(timeoutMap[fileToUpdate._id]);
    dispatch({
      type: "OPTIMISTIC_UPDATE",
      payload: {
        fileToUpdate,
        oldValue: { ...state.fileMap[fileToUpdate._id] }
      }
    });
    timeoutMap[fileToUpdate._id] = setTimeout(() => {
      fetch(filesURL, {
        method: "PUT",
        body: JSON.stringify(fileToUpdate),
        headers
      }).then(
        () =>
          dispatch({
            type: "UPDATE_SUCCESS",
            payload: { fileId: fileToUpdate._id }
          }),
        () =>
          dispatch({
            type: "UPDATE_FAIL",
            payload: { fileId: fileToUpdate._id }
          })
      );
    }, 2000);
  };

  const deleteFile = () => {
    const fileId = state.activeFileId;
    const oldValue = { ...state.fileMap[fileId] };
    dispatch({
      type: "OPTIMISTIC_DELETE",
      payload: { fileId, oldValue }
    });
    fetch(filesURL, {
      method: "DELETE",
      body: JSON.stringify({ _id: fileId }),
      headers
    }).then(
      () =>
        dispatch({
          type: "DELETE_SUCCESS",
          payload: { fileId }
        }),
      () =>
        dispatch({
          type: "DELETE_FAIL",
          payload: { fileId }
        })
    );
  };

  return (
    <>
      <button onClick={createFile}>Create</button>
      <button onClick={deleteFile}>Delete</button>
      {/* <span>{synced ? " synced" : " not synced"}</span> */}
      <List
        itemList={state.fileList}
        itemMap={state.fileMap}
        activeItemId={state.activeFileId}
        onItemClick={setActiveFileId}
      />
      <Editor file={activeFile} onFileUpdate={updateFile} />
    </>
  );
};

export default App;
