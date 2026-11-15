// ==UserScript==
// @name         Live Sub Count to Streamer.bot (Dynamic Page)
// @namespace    http://tampermonkey.net/
// @version      3.1
// @description  Pushes exact YT sub count to SB using active-row alignment parsing
// @match        https://studio.youtube.com/*
// @connect      127.0.0.1
// @connect      localhost
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let ws;
    let intervalId;
    let lastSubCount = 0;
    let hasFoundInitialNumber = false;

    // The Visual Coordinate Scraper
    function getTrueVisibleNumber(container) {
        const containerBox = container.getBoundingClientRect();
        // Find the exact vertical center line of the subscriber count box
        const centerY = containerBox.top + (containerBox.height / 2);

        const allElements = container.querySelectorAll('*');
        let columns = [];

        for (let el of allElements) {
            // Target only the deepest HTML nodes that actually contain a digit
            if (el.children.length === 0 && /\d/.test(el.innerText)) {
                const box = el.getBoundingClientRect();
                if (box.width === 0 || box.height === 0) continue; // Ignore completely hidden elements

                // Group the digits into vertical columns based on their X (horizontal) position
                let foundCol = columns.find(c => Math.abs(c.x - box.left) < 10);

                if (foundCol) {
                    foundCol.digits.push({ text: el.innerText, box: box });
                } else {
                    columns.push({
                        x: box.left,
                        digits: [{ text: el.innerText, box: box }]
                    });
                }
            }
        }

        // Sort the columns from left to right
        columns.sort((a, b) => a.x - b.x);

        let finalNumberString = "";

        for (let col of columns) {
            // For each column, find the digit that is physically closest to the vertical center
            let closestText = "";
            let minDistance = Infinity;

            for (let digitObj of col.digits) {
                const digitCenterY = digitObj.box.top + (digitObj.box.height / 2);
                const distance = Math.abs(digitCenterY - centerY);

                if (distance < minDistance) {
                    minDistance = distance;
                    // Strip out any commas or weird spacing just in case
                    closestText = digitObj.text.replace(/\D/g, '');
                }
            }
            finalNumberString += closestText;
        }

        return parseInt(finalNumberString, 10);
    }

    function scrapeAndSendSubCount() {
        const counterEl = document.querySelector('#counter.yta-explore-subscribers');

        if (counterEl) {
            const liveSubCountInt = getTrueVisibleNumber(counterEl);

            if (ws && ws.readyState === WebSocket.OPEN && !isNaN(liveSubCountInt) && liveSubCountInt > 0) {

                if (!hasFoundInitialNumber) {
                    hasFoundInitialNumber = true;
                    clearInterval(intervalId);
                    intervalId = setInterval(scrapeAndSendSubCount, 5000);
                    console.log(`⏱️ Initial count locked at ${liveSubCountInt}. Switching to 5-second polling loop.`);
                }

                // The Two-Way Guardrail (Kept as an absolute failsafe)
                if (lastSubCount !== 0) {
                    if (liveSubCountInt > lastSubCount * 2) {
                        console.warn(`⚠️ Blocked animation spike: ${liveSubCountInt}`);
                        return;
                    }
                    if (liveSubCountInt < lastSubCount * 0.5) {
                        console.warn(`⚠️ Blocked animation drop: ${liveSubCountInt}`);
                        return;
                    }
                }

                if (liveSubCountInt !== lastSubCount) {
                    const payload = {
                        request: "DoAction",
                        action: { name: "Update Sub Count" },
                        args: { liveSubCount: liveSubCountInt },
                        id: "yt-sub-update-trigger"
                    };

                    ws.send(JSON.stringify(payload));
                    console.log("🚀 Payload sent to Streamer.bot:", liveSubCountInt);

                    lastSubCount = liveSubCountInt;
                }
            }
        }
    }

    function connectWebSocket() {
        ws = new WebSocket('ws://127.0.0.1:8080/');

        ws.onopen = () => {
            console.log("🟢 Successfully connected to Streamer.bot WebSocket!");
            hasFoundInitialNumber = false;

            if (intervalId) clearInterval(intervalId);
            // Rapid-fire start to grab the number instantly on page load
            intervalId = setInterval(scrapeAndSendSubCount, 1000);
        };

        ws.onerror = (error) => {
            console.error("🔴 WebSocket error occurred.");
        };

        ws.onclose = () => {
            console.log("⚪ WebSocket connection closed. Reconnecting in 3 seconds...");
            if (intervalId) clearInterval(intervalId);
            setTimeout(connectWebSocket, 3000);
        };
    }

    connectWebSocket();
})();