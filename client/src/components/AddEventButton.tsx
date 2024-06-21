import React, {useState} from 'react';
import styled from 'styled-components';

const DropdownContainer = styled.div`
    position: relative;
    display: inline-block;
`;

const DropdownButtonStyled = styled.button`
    background-color: #3f51b5;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;

    &:hover {
        background-color: #303f9f;
    }
`;

const DropdownMenu = styled.div<{ show: boolean }>`
    display: ${({ show }) => (show ? 'block' : 'none')};
    position: absolute;
    top: 100%;
    left: 0;
    background-color: white;
    border: 1px solid #ccc;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    z-index: 1;
    border-radius: 4px;
    overflow: hidden;
`;

const MenuItem = styled.button`
    background-color: white;
    color: black;
    padding: 10px 20px;
    border: none;
    width: 100%;
    text-align: left;
    cursor: pointer;
    font-size: 16px;

    &:hover {
        background-color: #f1f1f1;
    }
`;

interface AddEventButtonProps {
    onAddEvent: (eventType: string) => void;
}

const AddEventButton: React.FC<AddEventButtonProps> = ({ onAddEvent }) => {
    const [showDropdown, setShowDropdown] = useState<boolean>(false);

    const handleMouseEnter = () => {
        setShowDropdown(true);
    };

    const handleMouseLeave = () => {
        setShowDropdown(false);
    };

    const handleMenuItemClick = (eventType: string) => {
        onAddEvent(eventType);
        setShowDropdown(false);
    };

    return (
        <DropdownContainer
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <DropdownButtonStyled>Add Event Interaction</DropdownButtonStyled>
            <DropdownMenu show={showDropdown}>
                <MenuItem onClick={() => handleMenuItemClick('slash')}>Slash Interaction</MenuItem>
                <MenuItem onClick={() => handleMenuItemClick('button')}>Button Interaction</MenuItem>
                <MenuItem onClick={() => handleMenuItemClick('select')}>Select Menu Interaction</MenuItem>
                <MenuItem onClick={() => handleMenuItemClick('modal')}>Modal Interaction</MenuItem>
            </DropdownMenu>
        </DropdownContainer>
    );
};

export default AddEventButton;
