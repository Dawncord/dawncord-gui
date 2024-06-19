import styled from "styled-components";
import React, {useEffect, useState} from "react";
import LinkedList from "../utils/LinkedList";
import axios from "axios";
import Select from "react-select";
import '../assets/styles/Methods.css';

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

interface MethodChainProps {
    isBotRunning: boolean;
    id: number;
    eventType: string;
    nameOrId: string;
    setNameOrId: (id: number, nameOrId: string) => void;
    onRemove: (id: number, nameOrId: string, eventType: string) => void;
    collapsed: boolean;
    toggleCollapse: (id: number) => void;
}

const MethodChain: React.FC<MethodChainProps> = (
    {
        isBotRunning,
        id,
        eventType,
        nameOrId,
        setNameOrId,
        onRemove,
        collapsed,
        toggleCollapse
    }) => {
    const [options, setOptions] = useState<MethodOption[]>([]);
    const [selectedOption, setSelectedOption] = useState<MethodOption | null>(null);
    const [methodChain, setMethodChain] = useState(new LinkedList<MethodItem>());
    const [selectedReplyOption, setSelectedReplyOption] = useState<MethodOption | null>(null);
    const [replyMethodChain, setReplyMethodChain] = useState(new LinkedList<MethodItem>());
    const [isReplySelected, setIsReplySelected] = useState(false);
    const [isExecuted, setIsExecuted] = useState(false);

    const handleNameOrIdChange = (event: any) => {
        setNameOrId(id, event.target.value);
        setIsExecuted(false);
    };

    const handleEventChange = async (selectedOption: MethodOption | null) => {
        setSelectedOption(selectedOption);
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

    const handleReplyEventChange = async (selectedOption: MethodOption | null) => {
        setSelectedReplyOption(selectedOption);
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

    const executeMethods = async () => {
        await axios.post('/bot/handlers/execute', formatMethodChain(), {params: {eventType: eventType}}
        )
            .then(() => {
                setIsExecuted(true);
            })
            .catch(error => {
                console.error('There was an error executing the method chain!', error);
            });
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                let response: any;
                switch (eventType) {
                    case 'slash':
                        response = await axios.get('/bot/handlers/slash');
                        break;
                    case 'button':
                        response = await axios.get('/bot/handlers/component', {params: {eventType: 'button'}});
                        break;
                    case 'select':
                        response = await axios.get('/bot/handlers/component', {params: {eventType: 'select'}});
                        break;
                    case 'modal':
                        response = await axios.get('/bot/handlers/component', {params: {eventType: 'modal'}});
                        break;
                }
                const options = response.data.methods.map((method: any) => ({
                    value: method.name,
                    label: method.name,
                    class: response.data.current
                }));
                setOptions(options);
            } catch (error) {
                console.error("There was an error fetching the slash data!", error);
            }
        };

        fetchData();
    }, [eventType]);

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
                    className: selectedOption?.class,
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
            formattedChain.commandName = nameOrId;
        }

        return formattedChain;
    };

    return (
        <div className={`method-chain-selector ${collapsed ? 'collapsed' : ''}`}>
            <div>
                {eventType && <span className="event-type">{eventType}</span>}
                <div>
                    {collapsed && <span className="command-name">{nameOrId}</span>}
                    <button className="collapse-btn" onClick={() => toggleCollapse(id)}>
                        {collapsed ? 'Expand' : 'Collapse'}
                    </button>
                </div>
                <button onClick={() => onRemove(id, nameOrId, eventType)}>Remove</button>
            </div>
            {!collapsed && (
                <div className="content">
                    <h2>Method Chain Selector</h2>
                    <div>
                        <label>
                            <h2>{eventType === 'slash' ? 'Command name' : 'Component id'}</h2>
                            <input
                                type="text"
                                placeholder={eventType === 'slash' ? 'Enter command name' : 'Enter component id'}
                                value={nameOrId}
                                onChange={handleNameOrIdChange}
                            />
                        </label>
                    </div>
                    <Select
                        value={selectedOption}
                        onChange={handleEventChange}
                        options={options}
                        placeholder="Select Slash Command"
                    />
                    {isReplySelected && (
                        <NestedBlock>
                            <h2>Reply Chain Selector</h2>
                            <Select
                                value={selectedReplyOption}
                                onChange={handleReplyEventChange}
                                options={options}
                                placeholder="Select Slash Command"
                            />
                            {[...replyMethodChain].map((node, index) => (
                                node.item.methods.length > 0 && (
                                    <div key={index}>
                                        <p>Methods for {node.item.className}.{node.item.methodName}</p>
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
                                <p>Methods for {node.item.className}.{node.item.methodName}</p>
                                <Select
                                    value={node.item.selectedMethod}
                                    onChange={(selectedOption) => handleMethodChange(selectedOption, index)}
                                    options={node.item.methods}
                                    placeholder={`Select Method for ${node.item.className}`}
                                />
                            </div>
                        )
                    ))}
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
            )}
        </div>
    );
};

const NestedBlock = styled.div`
    margin-left: 40px;
`;

export default MethodChain;