import MethodChain from "./MethodChain";
import React, {useState} from "react";
import axios from "axios";
import '../assets/styles/Methods.css';
import AddEventButton from "./AddEventButton";

interface Selector {
    id: number;
    eventType: string;
    nameOrId: string;
    collapsed: boolean;
}

const MethodChainManager: React.FC<{ isBotRunning: boolean }> = ({isBotRunning}) => {
    const [selectors, setSelectors] = useState<Selector[]>([]);

    const addEventConfiguration = (eventType: string) => {
        setSelectors([...selectors, {id: selectors.length, eventType: eventType, nameOrId: '', collapsed: false}]);
    };

    const setNameOrId = (id: number, nameOrId: string) => {
        setSelectors(selectors.map(selector => selector.id === id ? {...selector, nameOrId: nameOrId} : selector));
    };

    const toggleCollapse = (id: number) => {
        setSelectors(selectors.map(selector => selector.id === id ? {
            ...selector,
            collapsed: !selector.collapsed
        } : selector));
    };

    const removeEventConfiguration = async (id: number, nameOrId: string, eventType: string) => {
        try {
            eventType === 'slash'
                ? await axios.post('/bot/handlers/slash/remove', {commandName: nameOrId})
                : await axios.post('/bot/handlers/component/remove', {eventType: eventType, componentId: nameOrId});
            setSelectors(selectors.filter(selector => selector.id !== id));
        } catch (error) {
            console.error("There was an error deleting the command!", error);
        }
    };

    return (
        <div className="center-container">
            <div className="add-event-btn">
                <AddEventButton onAddEvent={addEventConfiguration}/>
            </div>
            <div className="elements">
                {selectors.map((selector) => (
                    <MethodChain
                        key={selector.id}
                        id={selector.id}
                        eventType={selector.eventType}
                        nameOrId={selector.nameOrId}
                        setNameOrId={setNameOrId}
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