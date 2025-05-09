function encodeAudio() {
    const fileInput = document.getElementById('fileUpload').files[0];
    const message = document.getElementById('message').value + '\0'; 

    if (!fileInput || !message) {
        alert('Please upload an audio file and enter a message.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
        const audioContext = new AudioContext();
        audioContext.decodeAudioData(event.target.result, (buffer) => {
            const audioData = buffer.getChannelData(0);
            const messageBits = [];

            for (let i = 0; i < message.length; i++) {
                const charCode = message.charCodeAt(i);
                for (let bit = 7; bit >= 0; bit--) {
                    messageBits.push((charCode >> bit) & 1);
                }
            }

            for (let i = 0; i < messageBits.length; i++) {
                audioData[i] = (audioData[i] & ~1) | messageBits[i]; 
            }

            const newBuffer = audioContext.createBuffer(1, audioData.length, buffer.sampleRate);
            newBuffer.copyToChannel(audioData, 0);

            const wavBlob = bufferToWave(newBuffer, newBuffer.length);
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'stego_audio.wav';
            a.click();
            URL.revokeObjectURL(url);
        }, (err) => {
            alert('Error decoding audio: ' + err.message);
        });
    };

    reader.readAsArrayBuffer(fileInput);
}

function decodeAudio() {
    const fileInput = document.getElementById('fileUpload').files[0];

    if (!fileInput) {
        alert('Please upload an audio file.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const audioContext = new AudioContext();
        audioContext.decodeAudioData(event.target.result, (buffer) => {
            const audioData = buffer.getChannelData(0);
            let charCode = 0;
            let message = '';

            for (let i = 0; i < audioData.length; i++) {
                charCode = (charCode << 1) | (audioData[i] & 1);
                if ((i + 1) % 8 === 0) {
                    const char = String.fromCharCode(charCode);
                    if (char === '\0') break; 
                    message += char;
                    charCode = 0;
                }
            }

            document.getElementById('output').innerText = "Hidden Message: " + message;
        });
    };

    reader.readAsArrayBuffer(fileInput);
}

function bufferToWave(buffer, len) {
    const numOfChannels = buffer.numberOfChannels,
        length = len * numOfChannels * 2 + 44,
        waveBuffer = new ArrayBuffer(length),
        view = new DataView(waveBuffer),
        channels = [],
        sampleRate = buffer.sampleRate;

    let offset = 0;

    function writeString(data) {
        for (let i = 0; i < data.length; i++) {
            view.setUint8(offset++, data.charCodeAt(i));
        }
    }

    function writeUint32(data) {
        view.setUint32(offset, data, true);
        offset += 4;
    }

    function writeUint16(data) {
        view.setUint16(offset, data, true);
        offset += 2;
    }

    writeString('RIFF');
    writeUint32(length - 8);
    writeString('WAVE');
    writeString('fmt ');
    writeUint32(16); 
    writeUint16(1); 
    writeUint16(numOfChannels);
    writeUint32(sampleRate);
    writeUint32(sampleRate * 2 * numOfChannels);
    writeUint16(numOfChannels * 2);
    writeUint16(16); 
    writeString('data');
    writeUint32(length - offset - 4);

    for (let i = 0; i < buffer.numberOfChannels; i++) {
        channels.push(buffer.getChannelData(i));
    }

    for (let i = 0; i < len; i++) {
        for (let channel = 0; channel < numOfChannels; channel++) {
            view.setInt16(offset, channels[channel][i] * 0x7FFF, true);
            offset += 2;
        }
    }

    return new Blob([waveBuffer], { type: 'audio/wav' });
}
