import React, { useState } from 'react';
import './App.css';

function App() {
    const [message, setMessage] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        fetch('http://localhost:3001/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        })
        .then((res) => res.json())
        .then((data) => setResponse(data.message));
    };

    const handleFindStocks = () => {
        setIsLoading(true);
        fetch('http://localhost:3001/tickers', {
            method: 'GET',
        })
        .then((res) => res.blob())
        .then((data) => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(data);
            link.download = 'stocks.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        })
        .finally(() => {
            setTimeout(() => setIsLoading(false), 30000);  // cooldown of 30 seconds
        });
    };

    return (
        <div className="App">
            <form onSubmit={handleSubmit}>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                ></textarea>
                <button type="submit">Submit</button>
                <button type="button" onClick={handleFindStocks} disabled={isLoading}>Find Stocks</button>
            </form>
            <div>{response}</div>
        </div>
    );
}

export default App;
