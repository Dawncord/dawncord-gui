import MethodChain from "./MethodChain";
import React, {useState} from "react";
import axios from "axios";
import '../assets/styles/Methods.css';

interface Selector {
    id: number;
    commandName: string;
    collapsed: boolean;
}

const MethodChainManager: React.FC<{ isBotRunning: boolean }> = ({isBotRunning}) => {
    const [selectors, setSelectors] = useState<Selector[]>([]);

    const addEventConfiguration = () => {
        setSelectors([...selectors, {id: selectors.length, commandName: '', collapsed: false}]);
    };

    const setCommandName = (id: number, name: string) => {
        setSelectors(selectors.map(selector => selector.id === id ? {...selector, commandName: name} : selector));
    };

    const toggleCollapse = (id: number) => {
        setSelectors(selectors.map(selector => selector.id === id ? {
            ...selector,
            collapsed: !selector.collapsed
        } : selector));
    };

    const removeEventConfiguration = async (id: number, commandName: string) => {
        try {
            commandName && await axios.post('/bot/handlers/remove', {commandName});
            setSelectors(selectors.filter(selector => selector.id !== id));
        } catch (error) {
            console.error("There was an error deleting the command!", error);
        }
    };

    return (
        <div className="center-container">
            <div className="add-event-btn">
                <button onClick={addEventConfiguration}>Add Event</button>
            </div>
            <div className="elements">
                {selectors.map((selector) => (
                    <MethodChain
                        key={selector.id}
                        id={selector.id}
                        commandName={selector.commandName}
                        setCommandName={setCommandName}
                        isBotRunning={isBotRunning}
                        onRemove={removeEventConfiguration}
                        collapsed={selector.collapsed}
                        toggleCollapse={toggleCollapse}
                    />
                ))}
            </div>
        </div>
    );
};

export default MethodChainManager;