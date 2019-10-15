import React, { useMemo } from "react";
import "./List.css";

const List = ({ itemList, itemMap, activeItemId, onItemClick }) => {
  const sortedList = useMemo(
    () => itemList.sort((a, b) => (a > b ? -1 : a < b ? 1 : 0)),
    [itemList]
  );

  const list = sortedList.map(itemId => (
    <li
      key={itemId}
      onClick={() => onItemClick(itemId)}
      className={itemId === activeItemId ? "active" : ""}
    >
      {itemMap[itemId] ? itemMap[itemId].title : ""}
    </li>
  ));

  return <ul>{list}</ul>;
};

export default List;
