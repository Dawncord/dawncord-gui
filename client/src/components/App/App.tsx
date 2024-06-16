import React, {useState} from 'react';
import '../../assets/styles/App.css';
import BotConnection from "../BotConnection";
import MethodChain from "../MethodChain";

function App() {
    const [isBotRunning, setIsBotRunning] = useState(false);

    return (
        <div className="App">
            <header className="App-header">
                <h1>Discord Bot Creator</h1>
            </header>
            <main className="App-main">
                <div className="container">
                    <div className="left-column">
                        <BotConnection isBotRunning={isBotRunning} setIsBotRunning={setIsBotRunning}/>
                    </div>
                    <div className="right-column">
                        <MethodChain isBotRunning={isBotRunning}/>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;



