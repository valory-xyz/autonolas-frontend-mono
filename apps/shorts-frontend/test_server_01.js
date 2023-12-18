const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Example "database" of videos
const videoDatabase = [
  {
    id: 1, video: 'QmSqX9ynWMvsiinfHPKhyjt5AjjFzXUi2VbGnZ7yJSzB4q', image: 'bafybeig64atqaladigoc3ds4arltdu63wkdrk3gesjfvnfdmz35amv7faq', prompt: 'Yada yada yada yada yada yada yada yada',
  },
  // ... more videos
];

// Middleware to parse the incoming requests with JSON payloads
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

// Handle POST request to the endpoint "/generate"
app.post('/generate', (req, res) => {
  // Here you would handle the incoming data as needed.
  // For now, let's just log it to the console and return a mock success response.
  console.log('Received request with data:', req.body);

  // Mock response for successful processing
  res.status(200).json({ success: true, message: 'Data processed', data: req.body });
});

// GET endpoint to serve video data
app.get('/responses', (req, res) => {
  // Normally, you would fetch this data from your database or another service.
  // The following line simulates this by sending the hardcoded videoDatabase array.
  res.status(200).json({ data: videoDatabase });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
