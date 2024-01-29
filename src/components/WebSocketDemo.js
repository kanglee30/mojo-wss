import React, { useState, useCallback, useEffect } from "react";
import useWebSocket, { ReadyState } from "react-use-websocket";
import { API_KEY, CRYPTO_KEYS, FOREX_KEYS } from "../constants";

export const WebSocketDemo = ({ type = "crypto" }) => {
  const [cryptoBoolean, setCryptoBoolean] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [currPriceA, setCurrPriceA] = useState([]);
  const [currPriceB, setCurrPriceB] = useState([]);

  const REST_URL_A = cryptoBoolean
    ? `https://api.polygon.io/v1/last/crypto/BTC/USD?apiKey=${API_KEY}`
    : `https://api.polygon.io/v2/aggs/ticker/C:EURUSD/prev?adjusted=true&apiKey=${API_KEY}`;
  const REST_URL_B = cryptoBoolean
    ? `https://api.polygon.io/v1/last/crypto/ETH/USD?apiKey=${API_KEY}`
    : `https://api.polygon.io/v2/aggs/ticker/C:CHFUSD/prev?adjusted=true&apiKey=${API_KEY}`;
  const WS_URL = cryptoBoolean
    ? "wss://socket.polygon.io/crypto "
    : "wss://socket.polygon.io/forex";

  const getSocketUrl = useCallback(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(WS_URL);
      }, 100);
    });
  }, [cryptoBoolean]);

  const { sendJsonMessage, lastJsonMessage, readyState, getWebSocket } =
    useWebSocket(getSocketUrl);

  const transformData = (data, tickerName, type = "last") => {
    switch (type) {
      case "last":
        return {
          ticker: tickerName,
          price: cryptoBoolean ? data.last.price : data.results[0].c,
        };
      case "agg":
        return {
          ticker: tickerName,
          price: data.c,
        };
      default:
        break;
    }
    return {
      ticker: tickerName,
      price: "unknown",
    };
  };

  useEffect(() => {
    setIsFetching(true);
    async function fetchData() {
      try {
        const [response1, response2] = await Promise.all([
          fetch(REST_URL_A),
          fetch(REST_URL_B),
        ]);

        if (!response1.ok || !response2.ok) {
          throw new Error("One or more requests failed");
        }

        // Parse the JSON data from the responses
        const data1 = await response1.json();
        const data2 = await response2.json();

        console.log("Data from fetch 1:", data1);
        console.log("Data from fetch 2:", data2);

        const updatedDataA = transformData(
          data1,
          cryptoBoolean ? "BTC" : "EUR"
        );
        const updatedDataB = transformData(
          data2,
          cryptoBoolean ? "ETH" : "CHF"
        );

        setCurrPriceA([updatedDataA]);
        setCurrPriceB([updatedDataB]);
      } catch (error) {
        // Handle errors such as network issues, failed requests, etc.
        console.error("Error fetching data:", error);
        throw error;
      }
    }

    fetchData();
    setIsFetching(true);
  }, [cryptoBoolean]);

  // Run when the connection state (readyState) changes
  useEffect(() => {
    const currParams = cryptoBoolean
      ? "XA.BTC-USD,XA.ETH-USD"
      : "CA.EUR/USD,CA.CHF/USD";
    if (readyState === ReadyState.OPEN) {
      sendJsonMessage({
        action: "auth",
        params: API_KEY,
      });
      sendJsonMessage({ action: "subscribe", params: currParams });
    }
  }, [readyState]);

  // Run when a new WebSocket message is received (lastJsonMessage)
  useEffect(() => {
    if (
      lastJsonMessage?.[0]?.ev ===
        (cryptoBoolean ? CRYPTO_KEYS.param : FOREX_KEYS.param) &&
      lastJsonMessage?.[0]?.pair ===
        (cryptoBoolean ? CRYPTO_KEYS.btc : FOREX_KEYS.eur)
    ) {
      setCurrPriceA((prevMessages) => {
        // Maintain a maximum of 20 items in the array
        const updatedData = transformData(
          lastJsonMessage[0],
          cryptoBoolean ? "BTC" : "EUR",
          "agg"
        );
        const updatedMessages = [...prevMessages, updatedData].slice(-20);
        return updatedMessages;
      });
    } else if (
      lastJsonMessage?.[0]?.ev ===
        (cryptoBoolean ? CRYPTO_KEYS.param : FOREX_KEYS.param) &&
      lastJsonMessage?.[0]?.pair ===
        (cryptoBoolean ? CRYPTO_KEYS.eth : FOREX_KEYS.chf)
    ) {
      setCurrPriceB((prevMessages) => {
        // Maintain a maximum of 20 items in the array
        const updatedData = transformData(
          lastJsonMessage[0],
          cryptoBoolean ? "ETH" : "CHF",
          "agg"
        );
        const updatedMessages = [...prevMessages, updatedData].slice(-20);
        return updatedMessages;
      });
    }

    console.log("lastJsonMessage", lastJsonMessage);
  }, [lastJsonMessage, cryptoBoolean]);

  // const connectionStatus = {
  //   [ReadyState.CONNECTING]: "Connecting",
  //   [ReadyState.OPEN]: "Open",
  //   [ReadyState.CLOSING]: "Closing",
  //   [ReadyState.CLOSED]: "Closed",
  //   [ReadyState.UNINSTANTIATED]: "Uninstantiated",
  // }[readyState];

  const handleSwitchClick = (type) => {
    setCryptoBoolean(!cryptoBoolean);
    setCurrPriceA([]);
    setCurrPriceB([]);
    getWebSocket().close();
  };

  return (
    <div>
      <button onClick={handleSwitchClick}>FOREX TAB </button>

      <button onClick={handleSwitchClick}>Crypto TAB </button>
      <h3>{cryptoBoolean ? "Bitcoin price" : "EURO price"}</h3>
      {currPriceA.length > 0 &&
        currPriceA.map((item) => {
          return (
            <div key={Math.random()}>
              {item.ticker} {item.price}
            </div>
          );
        })}

      <h3>{cryptoBoolean ? "ETH price" : "CHF price"}</h3>
      {currPriceB.length > 0 &&
        currPriceB.map((item) => {
          return (
            <div key={Math.random()}>
              {item.ticker} {item.price}
            </div>
          );
        })}
    </div>
  );
};
