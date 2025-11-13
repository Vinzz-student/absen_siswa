const ATTENDANCE_STORAGE = 'schoolAttendanceData_HadirToken';
const TOKEN_STORAGE = 'activeTokenData';
const SECRET_PASSWORD = 'tokenmapel';

const btnAbsen = document.getElementById('btn-absen');
const inputName = document.getElementById('input-name');
const inputToken = document.getElementById('input-token');
const currentSubject = document.getElementById('current-subject');

function showStatusOverlay(title, message, isSuccess = true) {
    const overlay = document.getElementById('status-overlay');
    const titleEl = document.getElementById('overlay-title');
    const messageEl = document.getElementById('overlay-message');

    titleEl.textContent = title;
    messageEl.textContent = message;
    
    titleEl.style.color = isSuccess ? '#03DAC6' : '#CF6679';

    overlay.classList.remove('hidden');
}

function hideStatusOverlay() {
    document.getElementById('status-overlay').classList.add('hidden');
}

function showPasswordOverlay() {
    document.getElementById('password-overlay').classList.remove('hidden');
    document.getElementById('guru-password-input').value = ''; 
}

function hidePasswordOverlay() {
    document.getElementById('password-overlay').classList.add('hidden');
}

function showGuruMenu() {
    showPasswordOverlay(); 
}

function verifyGuruPassword() {
    const enteredPassword = document.getElementById('guru-password-input').value;

    if (enteredPassword === SECRET_PASSWORD) {
        hidePasswordOverlay(); 
        const overlay = document.getElementById('guru-menu-overlay');
        overlay.classList.remove('hidden');

        const activeToken = JSON.parse(localStorage.getItem(TOKEN_STORAGE));
        if (activeToken) {
            document.getElementById('new-token').value = activeToken.token || '';
            document.getElementById('subject-name').value = activeToken.subject || '';
        }
    } else {
        hidePasswordOverlay();
        showStatusOverlay('Akses Ditolak!', 'Kata sandi salah. Akses dibatalkan.', false);
    }
}

function hideGuruMenu() {
    document.getElementById('guru-menu-overlay').classList.add('hidden');
}

function updateToken() {
    const newToken = document.getElementById('new-token').value.trim();
    const subjectName = document.getElementById('subject-name').value.trim();

    if (newToken.length !== 6 || !subjectName) {
        showStatusOverlay('Gagal Simpan!', 'Token harus 6 digit dan Mata Pelajaran tidak boleh kosong!', false);
        return;
    }

    const tokenData = {
        token: newToken,
        subject: subjectName,
        date: new Date().toLocaleDateString('id-ID')
    };
    
    localStorage.setItem(TOKEN_STORAGE, JSON.stringify(tokenData));
    hideGuruMenu();
    updateStatusDisplay();
    showStatusOverlay('Berhasil!', `Token dan Mapel berhasil diperbarui: ${subjectName}`, true);
}

function updateStatusDisplay() {
    const activeToken = JSON.parse(localStorage.getItem(TOKEN_STORAGE));
    if (activeToken) {
        currentSubject.innerHTML = `Mata Pelajaran Saat Ini: ${activeToken.subject}`;
        currentSubject.style.color = '#03DAC6';
    } else {
        currentSubject.innerHTML = `Mata Pelajaran Saat Ini: [Belum Ada Token Aktif]`;
        currentSubject.style.color = '#CF6679';
    }
}

function recordAttendance() {
    const studentName = inputName.value.trim();
    const studentToken = inputToken.value.trim();
    const activeTokenData = JSON.parse(localStorage.getItem(TOKEN_STORAGE));

    if (!studentName) {
        showStatusOverlay('Gagal Absen!', 'Nama lengkap tidak boleh kosong.', false);
        return;
    }

    if (!activeTokenData) {
        showStatusOverlay('Gagal!', 'Guru belum menentukan Token Absensi.', false);
        return;
    }

    if (studentToken !== activeTokenData.token) {
        showStatusOverlay('Gagal Absen!', 'Token yang Anda masukkan SALAH.', false);
        return;
    }
    
    const data = JSON.parse(localStorage.getItem(ATTENDANCE_STORAGE)) || [];
    const now = new Date();
    const dateKey = now.toLocaleDateString('id-ID');
    const time = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const alreadyAbsen = data.some(entry => 
        entry.date === dateKey && 
        entry.subject === activeTokenData.subject &&
        entry.name === studentName 
    );

    if (alreadyAbsen) {
        showStatusOverlay('Gagal Absen!', `Anda sudah Absen untuk Mapel ${activeTokenData.subject} hari ini.`, false);
        return;
    }
    
    const newEntry = {
        name: studentName,
        date: dateKey,
        time: time,
        subject: activeTokenData.subject,
        tokenUsed: studentToken,
        status: 'HADIR'
    };
    
    data.push(newEntry);
    localStorage.setItem(ATTENDANCE_STORAGE, JSON.stringify(data));
    
    showStatusOverlay('Absen Berhasil!', `Anda HADIR untuk Mapel ${activeTokenData.subject} pada ${time}!`, true);
    inputToken.value = ''; 
    renderHistory(data);
}

function groupDataBySubject(data) {
    const sortedData = [...data].sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
    
    return sortedData.reduce((acc, entry) => {
        const subject = entry.subject;
        if (!acc[subject]) {
            acc[subject] = [];
        }
        acc[subject].push(entry);
        return acc;
    }, {});
}

function renderHistory(data) {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = ''; 

    if (!data) {
        data = JSON.parse(localStorage.getItem(ATTENDANCE_STORAGE)) || [];
    }
    
    if (data.length === 0) {
        historyList.innerHTML = '<li>Belum ada riwayat absensi.</li>';
        return;
    }

    const currentUserName = inputName.value.trim();

    const groupedData = groupDataBySubject(data);

    for (const subject in groupedData) {
        const headerLi = document.createElement('li');
        headerLi.className = 'subject-header';
        headerLi.style.cssText = 'font-weight: bold; background-color: #383838; margin-top: 15px; border-left: 5px solid #BB86FC;';
        headerLi.textContent = `▶ ${subject}`;
        historyList.appendChild(headerLi);

        groupedData[subject].forEach(entry => {
            const displayName = entry.name || currentUserName || 'Nama Tidak Ditemukan';
            
            const li = document.createElement('li');
            
            li.innerHTML = `
                <span class="date-time">${entry.date} | ${entry.time}</span>
                <span class="location">Nama: ${displayName} | Mapel: ${entry.subject}</span>
            `;
            historyList.appendChild(li);
        });
    }
}


function printAttendanceList() {
    const studentName = inputName.value.trim(); 
    const rawData = JSON.parse(localStorage.getItem(ATTENDANCE_STORAGE)) || [];
    
    if (!studentName) {
        showStatusOverlay('Gagal Cetak!', 'Masukkan nama Anda sebelum mencetak riwayat.', false);
        return;
    }

    const fileName = `Riwayat_Absensi_${studentName.replace(/\s+/g, '_')}`;
    
    const groupedData = groupDataBySubject(rawData);
    let historyHtml = ''; 

    for (const subject in groupedData) {
        historyHtml += `<div class="subject-group-header"><h2>${subject}</h2><ul>`; 
        
        groupedData[subject].forEach(entry => {
            historyHtml += `
                <li>
                    <span class="date-time">${entry.date} | ${entry.time}</span>
                    <span class="location">Status: ${entry.status}</span> 
                </li>
            `;
        });
        historyHtml += '</ul></div>';
    }
    
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${fileName}</title> 
            <style>
                body { font-family: Arial, sans-serif; margin: 30px; color: #333; }
                h1 { color: #007bff; text-align: center; margin-bottom: 5px; }
                /* Style untuk Nama Siswa */
                h3 { text-align: center; font-weight: normal; margin-top: 0; margin-bottom: 20px;} 
                /* Style untuk Judul Mapel */
                h2 { margin-top: 15px; text-align: left; font-weight: bold; font-size: 1.2em; border-bottom: 2px solid #ccc; padding-bottom: 5px; color: #007bff; }
                
                ul { list-style: none; padding: 0; }
                .subject-group-header { margin-top: 20px; }
                li { border: 1px solid #ddd; padding: 10px; margin-bottom: 8px; border-radius: 4px; }
                .date-time { font-weight: bold; display: block; margin-bottom: 5px; }
                .location { font-size: 0.9em; color: #555; }
            </style>
        </head>
        <body>
            <h1>Rekap Kehadiran Siswa</h1>
            <h3>Nama: ${studentName}</h3>
            ${historyHtml} 
            <p style="text-align: right; margin-top: 20px;">Data diekspor pada: ${new Date().toLocaleString('id-ID')}</p>
        </body>
        </html>
    `;

    const printWindow = window.open('', fileName, 'height=600,width=800'); 
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = function() {
        printWindow.print();
    };
    
    showStatusOverlay('Mencetak/Simpan PDF', 'Silakan pilih "Save as PDF". Nama file yang disarankan adalah: **' + fileName + '**', true);
}

function sendPdfToTeacher() {
    const teacherEmail = 'email.guru.anda@sekolah.com';
    const studentName = document.getElementById('input-name').value.trim();
    
    if (!studentName) {
        showStatusOverlay('Gagal Kirim!', 'Masukkan nama Anda sebelum mengirim email.', false);
        return;
    }
    
    const subject = 'Laporan Kehadiran Siswa: ' + studentName;
    const body = 'Yth. Bapak/Ibu Guru,\n\nTerlampir adalah riwayat kehadiran saya dalam format PDF yang sudah saya download. Mohon diperiksa.\n\nTerima kasih.';
    const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&fs=1&to=${encodeURIComponent(teacherEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const alreadyAbsen = data.some(entry => 
    entry.date === dateKey && 
    entry.subject === activeTokenData.subject &&
    entry.name === studentName
);

    window.open(gmailUrl, '_blank');

    showStatusOverlay(
        'Instruksi Pengiriman (Gmail Web)', 
        'Tab/Window baru dengan Gmail telah terbuka. Silakan **Login** (jika perlu) dan **lampirkan file PDF** yang sudah Anda download tadi sebelum mengirim.', 
        true
    );
}

function loadLastUsedName() {
    const data = JSON.parse(localStorage.getItem(ATTENDANCE_STORAGE)) || [];
    
    const lastEntryWithName = data.reverse().find(entry => entry.name && entry.name.trim() !== '');

    if (lastEntryWithName) {
        inputName.value = lastEntryWithName.name.trim();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadLastUsedName();
    
    renderHistory(null);
    updateStatusDisplay();

});