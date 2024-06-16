interface Node<T> {
    item: T;
    next: Node<T> | null;
}

class LinkedList<T> implements Iterable<Node<T>> {
    head: Node<T> | null;
    size: number;

    constructor(otherList?: LinkedList<T>) {
        this.head = null;
        this.size = 0;

        if (otherList instanceof LinkedList) {
            let current = otherList.head;
            while (current) {
                this.add(current.item);
                current = current.next;
            }
        }
    }

    add(item: T): void {
        const newNode: Node<T> = { item, next: null };
        if (this.head === null) {
            this.head = newNode;
        } else {
            let current = this.head;
            while (current.next !== null) {
                current = current.next;
            }
            current.next = newNode;
        }
        this.size++;
    }

    replaceNode(item: T, index: number): void {
        const newNode: Node<T> = { item, next: null };
        if (index === 0) {
            newNode.next = this.head?.next || null;
            this.head = newNode;
        } else {
            let current = this.head;
            let count = 0;
            while (current && count < index - 1) {
                current = current.next;
                count++;
            }
            if (current && current.next) {
                newNode.next = current.next.next;
                current.next = newNode;
            }
        }
    }

    getNodeByIndex(index: number): Node<T> | null {
        if (index >= this.size) {
            return null;
        }
        let current = this.head;
        let count = 0;
        while (current !== null) {
            if (count === index) {
                return current;
            }
            count++;
            current = current.next;
        }
        return null;
    }

    [Symbol.iterator](): Iterator<Node<T>> {
        let current = this.head;
        return {
            next: (): IteratorResult<Node<T>> => {
                if (current) {
                    const value = current;
                    current = current.next;
                    return { value, done: false };
                }
                return { done: true } as IteratorResult<Node<T>>;
            }
        };
    }
}

export default LinkedList;
