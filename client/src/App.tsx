import React, {useEffect, useState} from 'react';
import axios from 'axios';
import Select from 'react-select';
import LinkedList from './LinkedList';
import styled from 'styled-components';
import './App.css';

interface MethodOption {
    value: string;
    label: string;
    class: string;
}

interface MethodItem {
    className: string;
    methodName: string;
    methods: MethodOption[];
    selectedMethod: MethodOption | null;
}

interface IntentOption {
    label: string;
    value: string;
}

const allIntents = [
    {label: 'ALL', value: 'ALL'},
    {label: 'GUILDS', value: 'GUILDS'},
    {label: 'GUILD_MEMBERS', value: 'GUILD_MEMBERS'},
    {label: 'GUILD_MODERATION', value: 'GUILD_MODERATION'},
    {label: 'GUILD_EMOJIS_AND_STICKERS', value: 'GUILD_EMOJIS_AND_STICKERS'},
    {label: 'GUILD_INTEGRATIONS', value: 'GUILD_INTEGRATIONS'},
    {label: 'GUILD_WEBHOOKS', value: 'GUILD_WEBHOOKS'},
    {label: 'GUILD_INVITES', value: 'GUILD_INVITES'},
    {label: 'GUILD_VOICE_STATES', value: 'GUILD_VOICE_STATES'},
    {label: 'GUILD_PRESENCES', value: 'GUILD_PRESENCES'},
    {label: 'GUILD_MESSAGES', value: 'GUILD_MESSAGES'},
    {label: 'GUILD_MESSAGE_REACTIONS', value: 'GUILD_MESSAGE_REACTIONS'},
    {label: 'GUILD_MESSAGE_TYPING', value: 'GUILD_MESSAGE_TYPING'},
    {label: 'DIRECT_MESSAGES', value: 'DIRECT_MESSAGES'},
    {label: 'DIRECT_MESSAGE_REACTIONS', value: 'DIRECT_MESSAGE_REACTIONS'},
    {label: 'DIRECT_MESSAGE_TYPING', value: 'DIRECT_MESSAGE_TYPING'},
    {label: 'MESSAGE_CONTENT', value: 'MESSAGE_CONTENT'},
    {label: 'GUILD_SCHEDULED_EVENTS', value: 'GUILD_SCHEDULED_EVENTS'},
    {label: 'AUTO_MODERATION_CONFIGURATION', value: 'AUTO_MODERATION_CONFIGURATION'},
    {label: 'AUTO_MODERATION_EXECUTION', value: 'AUTO_MODERATION_EXECUTION'}
];

function App() {
    const [botToken, setBotToken] = useState('');
    const [isBotRunning, setIsBotRunning] = useState(false);
    const [selectedIntents, setSelectedIntents] = useState<IntentOption[]>([]);
    const [commandName, setCommandName] = useState('');
    const [logs, setLogs] = useState('');
    const [slashOptions, setSlashOptions] = useState<MethodOption[]>([]);
    const [selectedSlashOption, setSelectedSlashOption] = useState<MethodOption | null>(null);
    const [methodChain, setMethodChain] = useState(new LinkedList<MethodItem>());
    const [selectedReplySlashOption, setSelectedReplySlashOption] = useState<MethodOption | null>(null);
    const [replyMethodChain, setReplyMethodChain] = useState(new LinkedList<MethodItem>());
    const [isReplySelected, setIsReplySelected] = useState(false);
    const [isExecuted, setIsExecuted] = useState(false);

    const handleChange = (event: any) => {
        setBotToken(event.target.value);
    };

    const handleIntentsChange = (selectedIntents: any) => {
        if (selectedIntents.some((intent: IntentOption) => intent.value === 'ALL')) {
            setSelectedIntents([{label: 'ALL', value: 'ALL'}]);
        } else {
            setSelectedIntents(selectedIntents);
        }
    };

    const handleCommandChange = (event: any) => {
        setCommandName(event.target.value);
        setIsExecuted(false);
    };

    const handleSlashChange = async (selectedOption: MethodOption | null) => {
        setSelectedSlashOption(selectedOption);
        setIsReplySelected(selectedOption?.value === 'reply');
        if (selectedOption) {
            const newMethodChain = createNewMethodChain(selectedOption);
            setMethodChain(newMethodChain);
            await fetchMethods(selectedOption.class, selectedOption.value, newMethodChain);
        } else {
            setMethodChain(new LinkedList<MethodItem>());
        }
        setIsExecuted(false);
    };

    const handleReplySlashChange = async (selectedOption: MethodOption | null) => {
        setSelectedReplySlashOption(selectedOption);
        if (selectedOption) {
            const newReplyMethodChain = createNewMethodChain(selectedOption);
            setReplyMethodChain(newReplyMethodChain);
            await fetchReplyMethods(selectedOption.class, selectedOption.value, newReplyMethodChain);
        } else {
            setReplyMethodChain(new LinkedList<MethodItem>());
        }
        setIsExecuted(false);
    };

    const handleMethodChange = (selectedOption: MethodOption | null, index: number) => {
        updateMethodChain(methodChain, setMethodChain, selectedOption, index, fetchMethods);
    };

    const handleReplyMethodChange = (selectedOption: MethodOption | null, index: number) => {
        updateMethodChain(replyMethodChain, setReplyMethodChain, selectedOption, index, fetchReplyMethods);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/bot/handlers/slash');
                const options = response.data.methods.map((method: any) => ({
                    value: method.name,
                    label: method.name,
                    class: response.data.current
                }));
                setSlashOptions(options);
            } catch (error) {
                console.error("There was an error fetching the slash data!", error);
            }
        };

        fetchData();
    }, []);

    useEffect(() => {
        async function fetchLogs() {
            try {
                const response = await axios.get('/bot/logs');
                const logsText = response.data;
                setLogs(logsText);
            } catch (error) {
                console.error('Error fetching logs:', error);
            }
        }

        fetchLogs();

        const intervalId = setInterval(fetchLogs, 5000);

        return () => clearInterval(intervalId);
    }, []);

    const createNewMethodChain = (selectedOption: MethodOption): LinkedList<MethodItem> => {
        const newMethodChain = new LinkedList<MethodItem>();
        newMethodChain.add({
            className: selectedOption.class,
            methodName: selectedOption.value,
            methods: [],
            selectedMethod: null
        });
        return newMethodChain;
    };

    const updateMethodChain = (
        methodChain: LinkedList<MethodItem>,
        setMethodChain: React.Dispatch<React.SetStateAction<LinkedList<MethodItem>>>,
        selectedOption: MethodOption | null,
        index: number,
        fetchMethods: (className: string, methodName: string, currentMethodChain: LinkedList<MethodItem>) => void
    ) => {
        const updatedMethodChain = new LinkedList<MethodItem>();
        let currentNode = methodChain.head;
        let currentIndex = 0;

        while (currentNode && currentIndex < index) {
            updatedMethodChain.add(currentNode.item);
            currentNode = currentNode.next;
            currentIndex++;
        }

        if (currentNode) {
            updatedMethodChain.add({
                ...currentNode.item,
                selectedMethod: selectedOption
            });
            fetchMethods(selectedOption?.class ?? '', selectedOption?.value ?? '', updatedMethodChain);
        } else if (selectedOption) {
            updatedMethodChain.add({
                className: selectedOption.class,
                methodName: selectedOption.value,
                methods: [],
                selectedMethod: null
            });
            fetchMethods(selectedOption.class, selectedOption.value, updatedMethodChain);
        }

        setMethodChain(updatedMethodChain);

        setIsExecuted(false);
    };

    const fetchMethodsGeneric = async (
        className: string,
        methodName: string,
        currentMethodChain: LinkedList<MethodItem>,
        setMethodChain: React.Dispatch<React.SetStateAction<LinkedList<MethodItem>>>,
    ) => {
        try {
            const initializeNewMethodChain = (currentMethodChain: LinkedList<MethodItem>): LinkedList<MethodItem> => {
                if (currentMethodChain.size === 0 || currentMethodChain.head?.item.selectedMethod === null) {
                    return new LinkedList<MethodItem>();
                }
                return new LinkedList<MethodItem>(currentMethodChain);
            };

            const mapResponseToOptions = (methods: any[], currentClass: string): MethodOption[] => {
                return methods.map(method => ({
                    value: method.name,
                    label: method.name,
                    class: currentClass
                }));
            };

            const response = await axios.get('/bot/handlers/methods', {
                params: {className, methodName}
            });

            const newMethodChain = initializeNewMethodChain(currentMethodChain);

            if (response.data?.methods) {
                const methods = mapResponseToOptions(response.data.methods, response.data.current);
                newMethodChain.add({className, methodName, methods, selectedMethod: null});
            } else {
                newMethodChain.add({className, methodName, methods: [], selectedMethod: null});
            }

            setMethodChain(newMethodChain);
        } catch (error) {
            console.error("There was an error fetching the methods data!", error);
        }
    };

    const fetchMethods = async (className: string, methodName: string, currentMethodChain = methodChain) => {
        await fetchMethodsGeneric(className, methodName, currentMethodChain, setMethodChain);
    };

    const fetchReplyMethods = async (className: string, methodName: string, currentReplyMethodChain = replyMethodChain) => {
        await fetchMethodsGeneric(className, methodName, currentReplyMethodChain, setReplyMethodChain);
    };

    const formatMethodChain = () => {
        let formattedChain: any = null;
        let currentChain: any = null;

        const createChainNode = (node?: any) => {
            return {
                className: node?.item?.className,
                methodName: node?.item?.methodName,
                child: null,
                next: null
            };
        };

        const doChain = (head: any) => {
            let chainNode = head.next;
            while (chainNode) {
                currentChain.next = createChainNode(chainNode)
                currentChain = currentChain.next;
                chainNode = chainNode.next;
            }
        };

        if (isReplySelected) {
            const replyHead = replyMethodChain.head;
            if (replyHead) {
                formattedChain = {
                    className: selectedSlashOption?.class,
                    methodName: 'reply',
                    child: createChainNode(replyHead),
                    next: null
                };
                currentChain = formattedChain.child;

                doChain(replyHead);
            }

            const methodHead = methodChain.head;
            if (methodHead) {
                currentChain = formattedChain;

                doChain(methodHead);
            }
        } else {
            const methodHead = methodChain.head;
            if (methodHead) {
                formattedChain = createChainNode(methodHead);
                currentChain = formattedChain;

                doChain(methodHead);
            }
        }

        if (formattedChain) {
            formattedChain.commandName=commandName;
        }

        return formattedChain;
    };

    const startBot = async () => {
        const intents: string[] = selectedIntents.map((intent: any) => intent.value);

        const botData: { token: string, intents: string[] } = {
            token: botToken,
            intents: intents,
        };

        await axios.post('http://localhost:8080/bot/start', botData, {
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(() => {
            setIsBotRunning(true);
        }).catch(error => {
            console.error('There was an error creating the bot!', error);
        });
    };

    const stopBot = async () => {
        await axios.post('/bot/stop', {
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(() => {
            setIsBotRunning(false);
        }).catch(error => {
            console.error('There was an error stopping the bot!', error);
        });
    };

    const toggleBot = async () => {
        isBotRunning ? await stopBot() : await startBot();
    };

    const executeMethods = async () => {
        await axios.post('/bot/handlers/execute', formatMethodChain())
            .then(() => {
                setIsExecuted(true);
            })
            .catch(error => {
                console.error('There was an error executing the method chain!', error);
            });
    }

    return (
        <div className="App">
            <header className="App-header">
                <h1>Discord Bot Creator</h1>
            </header>
            <main className="App-main">
                <div className="container">
                    <div className="left-column">
                        <div>
                            <label>
                                <h2>Bot token</h2>
                                <input
                                    type="text"
                                    placeholder="Enter bot token"
                                    value={botToken}
                                    onChange={handleChange}
                                />
                            </label>
                        </div>
                        <div>
                            <label>
                                <h2>Intents</h2>
                                <Select
                                    value={selectedIntents}
                                    options={allIntents}
                                    isMulti
                                    onChange={handleIntentsChange}
                                />
                            </label>
                        </div>
                        <div>
                            <label>
                                <h2>Command name</h2>
                                <input
                                    type="text"
                                    placeholder="Enter command name"
                                    value={commandName}
                                    onChange={handleCommandChange}
                                />
                            </label>
                        </div>
                        <div>
                            <h2>Method Chain Selector</h2>
                            <Select
                                value={selectedSlashOption}
                                onChange={handleSlashChange}
                                options={slashOptions}
                                placeholder="Select Slash Command"
                            />
                            {isReplySelected && (
                                <NestedBlock>
                                    <h2>Reply Chain Selector</h2>
                                    <Select
                                        value={selectedReplySlashOption}
                                        onChange={handleReplySlashChange}
                                        options={slashOptions}
                                        placeholder="Select Slash Command"
                                    />
                                    {[...replyMethodChain].map((node, index) => (
                                        node.item.methods.length > 0 && (
                                            <div key={index}>
                                                <h2>Methods for {node.item.className}.{node.item.methodName}</h2>
                                                <Select
                                                    value={node.item.selectedMethod}
                                                    onChange={(selectedOption) => handleReplyMethodChange(selectedOption, index)}
                                                    options={node.item.methods}
                                                    placeholder={`Select Method for ${node.item.className}`}
                                                />
                                            </div>
                                        )
                                    ))}
                                </NestedBlock>
                            )}
                            {[...methodChain].map((node, index) => (
                                node.item.methods.length > 0 && (
                                    <div key={index}>
                                        <h2>Methods for {node.item.className}.{node.item.methodName}</h2>
                                        <Select
                                            value={node.item.selectedMethod}
                                            onChange={(selectedOption) => handleMethodChange(selectedOption, index)}
                                            options={node.item.methods}
                                            placeholder={`Select Method for ${node.item.className}`}
                                        />
                                    </div>
                                )
                            ))}
                            <button onClick={toggleBot} className={isBotRunning ? 'stop' : ''}>
                                {isBotRunning ? 'Stop Bot' : 'Start Bot'}
                            </button>
                            {isBotRunning &&
                                <button
                                    disabled={isExecuted}
                                    onClick={executeMethods}
                                    className={isExecuted ? 'executed' : ''}
                                >
                                    {isExecuted ? 'Executed' : 'Execute Methods'}
                                </button>
                            }
                        </div>
                    </div>
                    <div className="right-column">
                        <h2>Logs</h2>
                        <div>
                            <textarea readOnly value={logs} rows={10} cols={50}></textarea>
                        </div>
                        {/*<pre>{logs}</pre>*/}
                    </div>
                </div>
            </main>
        </div>
    );
}

const NestedBlock = styled.div`
    margin-left: 40px;
`;

export default App;



