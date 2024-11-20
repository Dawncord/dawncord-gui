import React from "react";
import Select from "react-select";
import LinkedList from "../../utils/LinkedList";
import {MethodItem, MethodOption} from "../../utils/MethodUtils";

interface MethodChainProps {
    methodChain: LinkedList<MethodItem>;
    handleMethodChange: (selectedOption: MethodOption | null, index: number) => void;
}

const MethodChain: React.FC<MethodChainProps> = ({methodChain, handleMethodChange}) => {
    return (
        <>
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
        </>
    );
};

export default MethodChain;
