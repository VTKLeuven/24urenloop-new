'use client';

export default function QueryProxy() {
    return (
        <div style={{height: '100vh', width: '100%', margin: 0, padding: 0}}>
            <iframe
                src="http://localhost:5555"
                style={{border: 'none', width: '100%', height: '100%'}}
                sandbox="allow-scripts allow-same-origin allow-forms"
            />
        </div>
    );
}