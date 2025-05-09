function encodeMessage() {
    const fileInput = document.getElementById('fileUpload').files[0];
    const message = document.getElementById('message').value + '\0';

    if (!fileInput || !message) {
        alert('Please upload an image and enter a message.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function() {
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            for (let i = 0; i < message.length * 8; i++) {
                const charCode = message.charCodeAt(Math.floor(i / 8));
                data[i * 4] = (data[i * 4] & 0xFE) | ((charCode >> (7 - (i % 8))) & 1); 
            }

            ctx.putImageData(imageData, 0, 0);

            const stegoImage = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = stegoImage;
            a.download = 'stego_image.png';
            a.click();
        }
    }
    reader.readAsDataURL(fileInput);
}

function decodeMessage() {
    const fileInput = document.getElementById('fileUpload').files[0];

    if (!fileInput) {
        alert('Please upload an image.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.src = event.target.result;
        img.onload = function() {
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            let message = '';
            let charCode = 0;

            for (let i = 0; i < data.length / 4; i++) {
                charCode = (charCode << 1) | (data[i * 4] & 1); 
                if ((i + 1) % 8 === 0) { 
                    const char = String.fromCharCode(charCode);
                    if (char === '\0') break; 
                    message += char;
                    charCode = 0;
                }
            }

            document.getElementById('output').innerText = "Hidden Message: " + message;
        }
    }
    reader.readAsDataURL(fileInput);
}
