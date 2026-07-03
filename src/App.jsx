import React from 'react'
import WeatherDashboardDemo from './WeatherDashboardDemo'
import './styles/index.css'
import './styles/App.css'
function App() { return <WeatherDashboardDemo onBack={() => window.history.back()} /> }
export default App
