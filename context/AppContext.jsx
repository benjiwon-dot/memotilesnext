"use client";

import React, { createContext, useContext, useState } from "react";
import { translations } from "../utils/translations";

const AppContext = createContext();

export function AppProvider({ children }) {
  // Auth / User
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Language
  const [language, setLanguage] = useState("EN");

  // Cart / Tiles
  const [cart, setCart] = useState([]); // Array of tile objects
  const [tilesReadyCount, setTilesReadyCount] = useState(0);

  // Auth actions
  const login = () => setIsLoggedIn(true);
  const logout = () => {
    setIsLoggedIn(false);
    // 필요하면 여기서 cart 초기화 가능
    // setCart([]);
    // setTilesReadyCount(0);
  };

  // Cart actions
  const addTileToCart = (tile) => {
    setCart((prev) => [...prev, tile]);
    setTilesReadyCount((prev) => prev + 1);
  };

  // Translation helper
  const t = (key) => {
    return translations?.[language]?.[key] || key;
  };

  const value = {
    isLoggedIn,
    login,
    logout,

    language,
    setLanguage,

    cart,
    tilesReadyCount,
    addTileToCart,

    t,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
