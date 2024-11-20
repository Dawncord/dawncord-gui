import LinkedList from "./LinkedListTest";

export interface MethodOption {
    value: string;
    label: string;
    name: string;
    params: string[];
    class: string;
}

export interface MethodItem {
    className: string;
    methodName: string;
    methods: MethodOption[];
    selectedMethod: MethodOption | null;
    params: string[];
}
