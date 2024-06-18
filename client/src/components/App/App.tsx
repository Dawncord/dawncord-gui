import React, {useState} from 'react';
import '../../assets/styles/App.css';
import BotConnection from "../BotConnection";
import MethodChainManager from "../MethodChainManager";

function App() {
    const [isBotRunning, setIsBotRunning] = useState(false);

    return (
        <div className="App">
            <header className="App-header">
                <h1>Discord Bot Creator</h1>
            </header>
            <main className="App-main">
                <BotConnection isBotRunning={isBotRunning} setIsBotRunning={setIsBotRunning}/>
                <MethodChainManager isBotRunning={isBotRunning}/>
            </main>
        </div>
    );
}

export default App;



