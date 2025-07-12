async function generateQRCode(elementId, data, options = {}) {
  try {
    const response = await fetch('/api/hashing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ data })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Gagal membuat token');
    }

    const token = result.token;

    const defaultOptions = {
      text: token,
      width: 200,
      height: 200,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
      dotScale: 0.8,
      title: "Absensi QR Code",
      titleFont: "bold 16px Arial",
      titleColor: "#000000",
      titleBackgroundColor: "#ffffff",
      titleHeight: 50,
      titleTop: 20,
    };

    const mergedOptions = { ...defaultOptions, ...options };
    const qrcode = new QRCode(document.getElementById(elementId), mergedOptions);
    return qrcode;

  } catch (error) {
    console.error('QR Code generation failed:', error.message);
  }
}

function downloadQRCode(elementId, fileName = "qrcode") {
  const canvas = document.getElementById(elementId).querySelector("canvas");
  if (canvas) {
    const dataURL = canvas.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = dataURL;
    downloadLink.download = `${fileName}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  } else {
    console.error("Canvas element not found.");
  }
}




