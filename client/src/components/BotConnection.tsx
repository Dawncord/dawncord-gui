import Select from "react-select";
import React, {useEffect, useState} from "react";
import axios from "axios";
import '../assets/styles/Bot.css';

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

interface BotConnectionProps {
    isBotRunning: boolean;
    setIsBotRunning: (isRunning: boolean) => void;
}

const BotConnection: React.FC<BotConnectionProps> = ({isBotRunning, setIsBotRunning}) => {
    const [botToken, setBotToken] = useState('');
    const [selectedIntents, setSelectedIntents] = useState<IntentOption[]>([]);
    const [logs, setLogs] = useState('');

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

    const startBot = async () => {
        const intents: string[] = selectedIntents.map((intent: any) => intent.value);

        const botData: { token: string, intents: string[] } = {
            token: botToken,
            intents: intents,
        };

        await axios.post('/bot/start', botData, {
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

    return (
        <div className="left-container">
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
            <button onClick={toggleBot} className={isBotRunning ? 'stop' : ''}>
                {isBotRunning ? 'Stop Bot' : 'Start Bot'}
            </button>
            <div>
                <h2>Logs</h2>
                <textarea readOnly value={logs} rows={10} cols={50}></textarea>
                {/*<pre>{logs}</pre>*/}
            </div>
        </div>
    );
};

export default BotConnection;
