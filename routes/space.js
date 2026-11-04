const express = require('express');
const { spaceLimiter } = require('../middleware/limiters');
const { validateApodDate } = require('../utils/validation');

const router = express.Router();

const apodCache = new Map();
const TODAY_MAX_AGE = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_CACHE_SIZE = 100;

router.get('/', spaceLimiter, async (req, res) => {
    const { date } = req.query;

    const dateError = validateApodDate(date);
    if (dateError) {
        return res.status(400).json({ error: dateError });
    }

    const cacheKey = date || 'today';
    const cached = apodCache.get(cacheKey);
    const isFresh = cacheKey !== 'today' || Date.now() - cached?.savedAt < TODAY_MAX_AGE;

    if (cached && isFresh) {
        console.log('Cache hit:', cacheKey);
        return res.json(cached.data);
    }

    if (!process.env.NASA_API_KEY) {
        throw new Error('NASA_API_KEY is missing from .env');
    }

    let address = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic/';
    if (date) {
        const shortDate = date.slice(2).replaceAll('-', '');
        address = address + shortDate;
    }

    const nasaUrl = new URL(address);
    nasaUrl.searchParams.set('api_key', process.env.NASA_API_KEY);

    let nasaResponse;
    try {
        nasaResponse = await fetch(nasaUrl, { signal: AbortSignal.timeout(8000) });
    } catch (err) {
        return res.status(502).json({ error: 'Could not reach NASA. Try again later.' });
    }

    if (nasaResponse.status === 404) {
        return res.status(404).json({ error: 'NASA has no picture for that date.' });
    }
    if (!nasaResponse.ok) {
        console.error('NASA error:', nasaResponse.status);
        return res.status(502).json({ error: 'NASA could not send a picture right now.' });
    }

    const data = await nasaResponse.json();
    const picture = Array.isArray(data) ? data[0] : data;

    const result = {
        title: picture.title,
        date: picture.date,
        imageUrl: picture.hdurl,
        description: picture.alt,
        nasaPage: picture.permalink
    };

    apodCache.set(cacheKey, { data: result, savedAt: Date.now() });

    if (apodCache.size > MAX_CACHE_SIZE) {
        const oldestKey = apodCache.keys().next().value;
        apodCache.delete(oldestKey);
    }

    res.json(result);
});

module.exports = router;
