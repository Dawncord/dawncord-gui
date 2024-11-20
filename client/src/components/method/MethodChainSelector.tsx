import styled from "styled-components";
import React, {useEffect, useState} from "react";
import LinkedList from "../../utils/LinkedList";
import axios from "axios";
import Select from "react-select";
import '../../assets/styles/Methods.css';
import MethodChain from "./MethodChain";
import {MethodItem, MethodOption} from "../../utils/MethodUtils";

interface MethodChainSelectorProps {
    isBotRunning: boolean;
    id: number;
    eventType: string;
    nameOrId: string;
    setNameOrId: (id: number, nameOrId: string) => void;
    onRemove: (id: number, nameOrId: string, eventType: string) => void;
    collapsed: boolean;
    toggleCollapse: (id: number) => void;
}

const MethodChainSelector: React.FC<MethodChainSelectorProps> = (
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
        setIsReplySelected(selectedOption?.name === 'reply');
        if (selectedOption) {
            const newMethodChain = createNewMethodChain(selectedOption);
            setMethodChain(newMethodChain);
            await fetchMethods(selectedOption, newMethodChain);
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
            await fetchReplyMethods(selectedOption, newReplyMethodChain);
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
        const execute = async (url: string) => {
            await axios.post(url, formatMethodChain())
                .then(() => {
                    setIsExecuted(true)
                })
                .catch(error => {
                    console.error('There was an error executing the method chain!', error)
                });
        };

        const url = eventType === 'slash'
            ? `/bot/handlers/slash/${nameOrId}/execute`
            : `/bot/handlers/component/${eventType}/${nameOrId}/execute`;

        await execute(url);
    };

    useEffect(() => {
        const fetchData = async () => {
            const url = eventType === 'slash'
                ? '/bot/handlers/slash'
                : '/bot/handlers/component';
            const params = eventType !== 'slash'
                ? {params: {eventType}}
                : undefined;

            await axios.get(url, params)
                .then(response => {
                    const options = response.data.methods.map((method: any) => ({
                        value: method.name + (method.params.length > 0 ? '(' + method.params.map((param: any) => param.name).join(', ') + ')' : ''),
                        label: method.name + (method.params.length > 0 ? '(' + method.params.map((param: any) => param.name).join(', ') + ')' : ''),
                        name: method.name,
                        params: method.params.map((param: any) => param.type),
                        class: response.data.current,
                    }));

                    setOptions(options);
                })
                .catch(error => {
                    console.error("There was an error fetching the data!", error);
                });
        };

        fetchData();
    }, [eventType]);

    const createNewMethodChain = (selectedOption: MethodOption): LinkedList<MethodItem> => {
        const newMethodChain = new LinkedList<MethodItem>();
        newMethodChain.add({
            className: selectedOption.class,
            methodName: selectedOption.value,
            methods: [],
            selectedMethod: null,
            params: selectedOption.params
        });
        return newMethodChain;
    };

    const updateMethodChain = (
        methodChain: LinkedList<MethodItem>,
        setMethodChain: React.Dispatch<React.SetStateAction<LinkedList<MethodItem>>>,
        selectedOption: MethodOption | null,
        index: number,
        fetchMethods: (selectedOption: MethodOption, currentMethodChain: LinkedList<MethodItem>) => void
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
        } else if (selectedOption) {
            updatedMethodChain.add({
                className: selectedOption.class,
                methodName: selectedOption.value,
                methods: [],
                selectedMethod: null,
                params: selectedOption.params
            });
        }
        fetchMethods(selectedOption!!, updatedMethodChain);

        setMethodChain(updatedMethodChain);

        setIsExecuted(false);
    };

    const fetchMethodsGeneric = async (
        selectedOption: MethodOption,
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
                    value: method.name + (method.params.length > 0 ? '(' + method.params.map((param: any) => param.name).join(', ') + ')' : ''),
                    label: method.name + (method.params.length > 0 ? '(' + method.params.map((param: any) => param.name).join(', ') + ')' : ''),
                    name: method.name,
                    params: method.params.map((param: any) => param.type),
                    class: currentClass
                }));
            };

            const response = await axios.get('/bot/handlers/methods', {
                params: {
                    className: selectedOption.class,
                    methodName: selectedOption.name,
                    params: selectedOption.params.join(',')
                }
            });

            const newMethodChain = initializeNewMethodChain(currentMethodChain);

            if (response.data?.methods) {
                const methods = mapResponseToOptions(response.data.methods, response.data.current);
                newMethodChain.add({
                    className: selectedOption.class,
                    methodName: selectedOption.name,
                    methods,
                    selectedMethod: null,
                    params: selectedOption.params
                });
            } else {
                newMethodChain.add({
                    className: selectedOption.class,
                    methodName: selectedOption.name,
                    methods: [],
                    selectedMethod: null,
                    params: selectedOption.params
                });
            }

            setMethodChain(newMethodChain);
        } catch (error) {
            console.error("There was an error fetching the methods data!", error);
        }
    };

    const fetchMethods = async (selectedOption: MethodOption, currentMethodChain = methodChain) => {
        await fetchMethodsGeneric(selectedOption, currentMethodChain, setMethodChain);
    };

    const fetchReplyMethods = async (selectedOption: MethodOption, currentReplyMethodChain = replyMethodChain) => {
        await fetchMethodsGeneric(selectedOption, currentReplyMethodChain, setReplyMethodChain);
    };

    const formatMethodChain = () => {
        let formattedChain: any = null;
        let currentChain: any = null;

        const createChainNode = (node?: any) => {
            return {
                className: node?.item?.className,
                methodName: node?.item?.methodName,
                params: node?.item?.params || [],
                child: null,
                next: null
            };
        };

        const doChain = (head: any) => {
            let chainNode = head.next;
            while (chainNode) {
                const newNode = createChainNode(chainNode);
                currentChain.next = newNode;
                currentChain = newNode;
                chainNode = chainNode.next;
            }
        };

        if (isReplySelected) {
            const replyHead = replyMethodChain.head;
            if (replyHead) {
                formattedChain = {
                    className: selectedOption?.class,
                    methodName: 'reply',
                    params: [],
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
                    <h2>Methods</h2>
                    <Select
                        value={selectedOption}
                        onChange={handleEventChange}
                        options={options}
                        placeholder="Select Slash Command"
                    />
                    {isReplySelected && (
                        <NestedBlock>
                            <h2>Reply</h2>
                            <Select
                                value={selectedReplyOption}
                                onChange={handleReplyEventChange}
                                options={options}
                                placeholder="Select Slash Command"
                            />
                            <MethodChain
                                methodChain={replyMethodChain}
                                handleMethodChange={handleReplyMethodChange}
                            />
                        </NestedBlock>
                    )}
                    <MethodChain
                        methodChain={methodChain}
                        handleMethodChange={handleMethodChange}
                    />
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

export default MethodChainSelector;
