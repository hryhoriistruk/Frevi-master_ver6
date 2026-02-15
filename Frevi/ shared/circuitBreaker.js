// shared/circuitBreaker.js
const CircuitBreaker = require('opossum');

const breaker = new CircuitBreaker(async (url) => {
    const response = await axios.get(url);
    return response.data;
}, {
    timeout: 3000,
    errorThresholdPercentage: 50
});
