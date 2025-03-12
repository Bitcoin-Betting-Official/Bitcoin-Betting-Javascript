// Configuration for the node connection and subscription
const config = {
    NODE_URL: 'wss://node82.sytes.net:82', // Example public node URL; adjust as needed
    NODE_ID: 1, // Example Node ID
};

// Global storage for markets and a limit of 10
let allMarkets = [];
const maxMarkets = 10; // Stop receiving new markets after first 10

// A flag to ensure no further processing once limit is reached
let subscriptionClosed = false;

// Helper function to generate a nonce (here using current timestamp)
function getCurrentNonce() {
    return Date.now();
}

/**
 * Searches markets by filter and subscribes to the initial batch.
 *
 * @param {Object} options - Options for searching markets.
 * @param {Object} options.marketFilter - The filter criteria (e.g., Cat, OnlyActive, Status, PageSize).
 * @param {boolean} [options.subscribeOrderbooks=false] - Whether to subscribe to orderbook updates.
 * @param {number} [options.maxResults=1000] - The maximum results to request.
 * @returns {Promise<Array>} - Resolves with an array of market objects.
 */
function subscribeMarkets({marketFilter, subscribeOrderbooks = false, maxResults = 1000}) {
    const ws = new WebSocket(config.NODE_URL);

    ws.onopen = () => {
        console.log('WebSocket connection opened.');
        // Build the subscription request according to the API specification.
        const request = {
            Type: 'SubscribeMarketsByFilter',
            MaxResults: maxResults,
            Nonce: getCurrentNonce(),
            Data: {
                MarketFilter: marketFilter,
                SubscribeOrderbooks: subscribeOrderbooks,
            },
        };
        ws.send(JSON.stringify(request));
    };

    ws.onmessage = (event) => {
        // If we've already closed the subscription, ignore further messages.
        if (subscriptionClosed) return;

        try {
            const message = JSON.parse(event.data);
            console.log('Received message:', message);
            if (message.Type === 'SubscribeMarketsByFilter') {
                // If the initial batch is received as an array...
                if (Array.isArray(message.Data)) {
                    // Only keep up to maxMarkets from the initial batch
                    allMarkets = message.Data.slice(0, maxMarkets);
                    updateMarketsTable(allMarkets);
                    console.log(`Received initial batch of ${allMarkets.length} markets. Closing connection.`);
                    subscriptionClosed = true;
                    ws.close(); // Stop receiving further updates
                } else if (typeof message.Data === 'object') {
                    // If individual updates are received, add them only if we don't have enough markets yet.
                    updateOrAddMarket(message.Data);
                    // If we've reached our limit, close the connection.
                    if (allMarkets.length >= maxMarkets) {
                        console.log(`Reached ${maxMarkets} markets. Closing WebSocket connection.`);
                        subscriptionClosed = true;
                        ws.close();
                    }
                }
            }
        } catch (error) {
            console.error('Error processing message:', error);
        }
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
        console.log('WebSocket connection closed.');
    };
}

/**
 * Updates the table with the given list of markets.
 * @param {Array} markets - Array of market objects.
 */
function updateMarketsTable(markets) {
    const tbody = document.getElementById('marketsBody');
    tbody.innerHTML = '';
    markets.forEach((market) => {
        const row = createMarketRow(market);
        tbody.appendChild(row);
    });
}

/**
 * Updates or adds a single market.
 * Ignores new markets if the limit is already reached.
 * @param {Object} market - A market object.
 */
function updateOrAddMarket(market) {
    // If we already have reached the limit, do nothing.
    if (allMarkets.length >= maxMarkets) return;

    const exists = allMarkets.some(m => m.ID === market.ID);
    if (!exists) {
        allMarkets.push(market);
        updateMarketsTable(allMarkets);
    }
}

/**
 * Creates a table row element for a given market.
 * @param {Object} market - A market object.
 * @returns {HTMLElement} - The table row element.
 */
function createMarketRow(market) {
    const tr = document.createElement('tr');
    // Set an ID on the row for future updates (assuming market.ID is unique)
    tr.id = `market-${market.ID}`;

    const idCell = document.createElement('td');
    idCell.textContent = market.ID || '';

    const titleCell = document.createElement('td');
    titleCell.textContent = market.Title || '';

    const descCell = document.createElement('td');
    descCell.textContent = market.Descr || '';

    const compCell = document.createElement('td');
    compCell.textContent = market.Comp || '';

    const closeCell = document.createElement('td');
    closeCell.textContent = market.ClosD || '';

    const settleCell = document.createElement('td');
    settleCell.textContent = market.SettlD || '';

    tr.appendChild(idCell);
    tr.appendChild(titleCell);
    tr.appendChild(descCell);
    tr.appendChild(compCell);
    tr.appendChild(closeCell);
    tr.appendChild(settleCell);

    return tr;
}

// Start the markets subscription when the page loads.
subscribeMarkets({
    marketFilter: {
        Cat: 2,           // Example category ID
        OnlyActive: true,
        Status: 1,        // For example, 1 might represent "in-play"
        PageSize: 10,    // Maximum items per page
    },
    subscribeOrderbooks: true,
    maxResults: 100,
});