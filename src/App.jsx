import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [pets, setPets] = useState(() => {
    const saved = localStorage.getItem('pawroutine_pets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map(p => ({
          ...p,
          foodList: p.foodList || [],
          feedLogToday: p.feedLogToday || [],
          historyDays: p.historyDays || [],
          waterGiven: p.waterGiven || false,
          vitaminGiven: p.vitaminGiven || false
        }));
      } catch (e) {
        console.error("Gagal parse localStorage", e);
      }
    }
    return [
      {
        id: 1,
        name: 'Musang Jojo',
        species: 'Musang / Civet',
        photo: null,
        feedLogToday: [],
        vitaminGiven: false,
        waterGiven: false,
        lastBath: '3 hari yang lalu',
        lastDeworm: '2 bulan yang lalu',
        estimatedAge: '± 6 bulan',
        historyDays: [],
        foodList: [
          { id: 101, name: 'Pisang', qty: 12, unit: 'potong / iris', type: 'food', note: 'Stok di kulkas' },
          { id: 102, name: 'Vitamin Cair', qty: 1, unit: 'botol', type: 'vitamin', note: 'Suplemen harian' }
        ]
      },
      {
        id: 2,
        name: 'Kucing Miko',
        species: 'Kucing / Cat',
        photo: null,
        feedLogToday: [],
        vitaminGiven: false,
        waterGiven: false,
        lastBath: '1 minggu yang lalu',
        lastDeworm: '3 bulan yang lalu',
        estimatedAge: '± 1 tahun',
        historyDays: [],
        foodList: [
          { id: 201, name: 'Cat Choize', qty: 30, unit: 'takaran / genggam', type: 'food', note: 'Makanan kering' },
          { id: 202, name: 'Vitamin Kulit', qty: 1, unit: 'botol', type: 'vitamin', note: 'Suplemen bulu' }
        ]
      }
    ];
  });

  const [activePetId, setActivePetId] = useState(() => {
    const saved = localStorage.getItem('pawroutine_active_id');
    return saved ? Number(saved) : 1;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAnimation, setShowAnimation] = useState(false);
  const [feedAmountInput, setFeedAmountInput] = useState(1);

  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodQty, setNewFoodQty] = useState(10);
  const [newFoodUnit, setNewFoodUnit] = useState('takaran / genggam');
  const [newFoodType, setNewFoodType] = useState('food');
  const [newFoodNote, setNewFoodNote] = useState('');

  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [newPetName, setNewPetName] = useState('');
  const [newPetSpecies, setNewPetSpecies] = useState('Kucing / Cat');

  const [isEditingJournal, setIsEditingJournal] = useState(false);
  const [tempJournal, setTempJournal] = useState({ estimatedAge: '', lastBath: '', lastDeworm: '' });

  const fileInputRef = useRef(null);
  const restoreFileRef = useRef(null);

  const currentPet = pets.find(p => p.id === activePetId) || pets[0];

  useEffect(() => {
    localStorage.setItem('pawroutine_pets', JSON.stringify(pets));
  }, [pets]);

  useEffect(() => {
    localStorage.setItem('pawroutine_active_id', activePetId);
  }, [activePetId]);

  useEffect(() => {
    if (currentPet) {
      setTempJournal({
        estimatedAge: currentPet.estimatedAge || '',
        lastBath: currentPet.lastBath || '',
        lastDeworm: currentPet.lastDeworm || ''
      });
    }
  }, [activePetId]);

  const playCuteSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPets(prev => prev.map(p => p.id === activePetId ? { ...p, photo: reader.result } : p));
      };
      reader.readAsDataURL(file);
    }
  };

  const foodItems = currentPet.foodList || [];
  
  const totalFoodQty = foodItems.filter(i => i.type === 'food' || !i.type).reduce((acc, item) => acc + item.qty, 0);
  const totalVitaminQty = foodItems.filter(i => i.type === 'vitamin').reduce((acc, item) => acc + item.qty, 0);

  const handleFeed = () => {
    if (totalFoodQty <= 0) {
      alert("Stok makanan kosong! Silakan tambah takaran stok terlebih dahulu.");
      return;
    }

    const porsiDiberikan = Number(feedAmountInput);

    const mainFoodItem = foodItems.find(i => i.type === 'food' || !i.type);
    if (mainFoodItem && mainFoodItem.qty < porsiDiberikan) {
      alert(`Stok takaran tidak cukup! Sisa ${mainFoodItem.name} tinggal ${mainFoodItem.qty} ${mainFoodItem.unit}, tidak bisa kasih ${porsiDiberikan} porsi.`);
      return;
    }

    playCuteSound();
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 2000);

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newLog = { id: Date.now(), time: currentTime, amount: porsiDiberikan };

    setPets(prev => prev.map(p => {
      if (p.id === activePetId) {
        let remainingToSubtract = porsiDiberikan;
        const updatedFoodList = (p.foodList || []).map(item => {
          if ((item.type === 'food' || !item.type) && remainingToSubtract > 0) {
            const take = Math.min(item.qty, remainingToSubtract);
            remainingToSubtract -= take;
            return { ...item, qty: item.qty - take };
          }
          return item;
        });

        return { 
          ...p, 
          feedLogToday: [...(p.feedLogToday || []), newLog],
          foodList: updatedFoodList
        };
      }
      return p;
    }));
  };

  const handleDeleteFeedLog = (logId) => {
    setPets(prev => prev.map(p => {
      if (p.id === activePetId) {
        const updatedLogs = (p.feedLogToday || []).filter(l => l.id !== logId);
        return { ...p, feedLogToday: updatedLogs };
      }
      return p;
    }));
  };

  const handleVitamin = () => {
    if (totalVitaminQty <= 0) {
      alert("Stok vitamin kosong!");
      return;
    }

    playCuteSound();
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 2000);
    setPets(prev => prev.map(p => p.id === activePetId ? { ...p, vitaminGiven: true } : p));
  };

  const handleWater = () => {
    playCuteSound();
    setPets(prev => prev.map(p => p.id === activePetId ? { ...p, waterGiven: true } : p));
  };

  const handleBathDone = () => {
    playCuteSound();
    setPets(prev => prev.map(p => p.id === activePetId ? { ...p, lastBath: 'Baru saja (Hari ini)' } : p));
  };

  const handleSaveJournal = (e) => {
    e.preventDefault();
    setPets(prev => prev.map(p => {
      if (p.id === activePetId) {
        return {
          ...p,
          estimatedAge: tempJournal.estimatedAge,
          lastBath: tempJournal.lastBath,
          lastDeworm: tempJournal.lastDeworm
        };
      }
      return p;
    }));
    setIsEditingJournal(false);
  };

  const handleAddPet = (e) => {
    e.preventDefault();
    if (!newPetName) return;
    const newPetObj = {
      id: Date.now(),
      name: newPetName,
      species: newPetSpecies,
      photo: null,
      feedLogToday: [],
      vitaminGiven: false,
      waterGiven: false,
      lastBath: 'Baru saja',
      lastDeworm: 'Belum tercatat',
      estimatedAge: '± 3 bulan',
      historyDays: [],
      foodList: []
    };
    setPets(prev => [...prev, newPetObj]);
    setActivePetId(newPetObj.id);
    setNewPetName('');
    setShowAddPetModal(false);
  };

  const handleDeletePet = (id) => {
    if (pets.length <= 1) {
      alert("Minimal harus ada 1 anabul dalam aplikasi!");
      return;
    }
    if (window.confirm("Hapus profil anabul ini?")) {
      const remaining = pets.filter(p => p.id !== id);
      setPets(remaining);
      setActivePetId(remaining[0].id);
    }
  };

  const handleResetDay = () => {
    const todayStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
    
    setPets(prev => prev.map(p => {
      if (p.id === activePetId) {
        const logs = p.feedLogToday || [];
        const totalPorsi = logs.reduce((acc, curr) => acc + curr.amount, 0);
        const daySummary = { 
          date: todayStr, 
          totalFeed: totalPorsi, 
          logs: logs, 
          vitamin: p.vitaminGiven,
          water: p.waterGiven 
        };
        return {
          ...p,
          feedLogToday: [],
          vitaminGiven: false,
          waterGiven: false,
          historyDays: [daySummary, ...(p.historyDays || [])]
        };
      }
      return p;
    }));
    alert("Hari berhasil di-reset & dimasukkan ke Kalender Log!");
  };

  const handleAddCustomFood = (e) => {
    e.preventDefault();
    if (!newFoodName) return;
    const newItem = { 
      id: Date.now(), 
      name: newFoodName, 
      qty: Number(newFoodQty), 
      unit: newFoodUnit, 
      type: newFoodType, 
      note: newFoodNote 
    };
    
    setPets(prev => prev.map(p => {
      if (p.id === activePetId) {
        return { ...p, foodList: [...(p.foodList || []), newItem] };
      }
      return p;
    }));

    setNewFoodName('');
    setNewFoodQty(10);
    setNewFoodNote('');
  };

  const handleUpdateStock = (foodId, delta) => {
    setPets(prev => prev.map(p => {
      if (p.id === activePetId) {
        const foodArr = p.foodList || [];
        const updatedFood = foodArr.map(f => f.id === foodId ? { ...f, qty: Math.max(0, f.qty + delta) } : f);
        return { ...p, foodList: updatedFood };
      }
      return p;
    }));
  };

  const handleDeleteFood = (foodId) => {
    setPets(prev => prev.map(p => {
      if (p.id === activePetId) {
        const foodArr = p.foodList || [];
        const filteredFood = foodArr.filter(f => f.id !== foodId);
        return { ...p, foodList: filteredFood };
      }
      return p;
    }));
  };

  const handleExportBackup = () => {
    const backupData = { pets, exportDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pawroutine-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const handleImportBackup = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.pets) {
            setPets(data.pets);
            setActivePetId(data.pets[0].id);
            alert("Data berhasil dipulihkan!");
          } else {
            alert("Format file backup tidak valid!");
          }
        } catch (err) {
          alert("Gagal membaca file JSON.");
        }
      };
      reader.readAsText(file);
    }
  };

  const feedLogs = currentPet.feedLogToday || [];
  const totalPorsiToday = feedLogs.reduce((acc, curr) => acc + curr.amount, 0);
  const historyList = currentPet.historyDays || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 sm:p-8 font-sans pb-24 relative overflow-x-hidden">
      
      {showAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-4">
          <div className="bg-slate-900 border border-emerald-500/40 p-6 rounded-3xl shadow-2xl text-center space-y-4 max-w-xs w-full">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 overflow-hidden flex items-center justify-center text-4xl shadow-inner">
              {currentPet.photo ? (
                <img src={currentPet.photo} alt="Anabul" className="w-full h-full object-cover" />
              ) : (
                <span>🐾</span>
              )}
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-emerald-400">Yummy! {currentPet.name} Kenyang</h2>
              <p className="text-xs text-slate-300">Stok takaran berkurang & catatan tersimpan.</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md w-full space-y-6">
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-emerald-400 tracking-wide">PawRoutine 🐾</h1>
              <p className="text-xs text-slate-400">Multi-Pet PWA Routine & Alarm Tracker</p>
            </div>
            <button 
              onClick={() => setShowAddPetModal(true)}
              className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-3 py-1.5 rounded-xl border border-emerald-500/30 font-medium transition"
            >
              + Anabul Baru
            </button>
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-1 pt-1">
            {pets.map(p => (
              <button
                key={p.id}
                onClick={() => setActivePetId(p.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                  activePetId === p.id 
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md' 
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <span>{p.photo ? '📸' : '🐾'}</span>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl shadow-lg">
          <button onClick={() => setActiveTab('dashboard')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'dashboard' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>🏠 Dashboard</button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'history' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>📅 Kalender Log</button>
          <button onClick={() => setActiveTab('settings')} className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'settings' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>⚙️ Backup & Set</button>
        </div>

        {/* ================= TAB 1: DASHBOARD ================= */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-3xl shadow-inner overflow-hidden cursor-pointer relative group"
                  >
                    {currentPet.photo ? (
                      <img src={currentPet.photo} alt="Anabul" className="w-full h-full object-cover" />
                    ) : (
                      <span>🐾</span>
                    )}
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-emerald-300 transition font-medium">
                      Ganti
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />

                  <div>
                    <h2 className="text-lg font-bold text-slate-100">{currentPet.name}</h2>
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full font-medium border border-emerald-500/20">
                      {currentPet.species}
                    </span>
                  </div>
                </div>

                {pets.length > 1 && (
                  <button onClick={() => handleDeletePet(currentPet.id)} className="text-xs text-rose-400 hover:bg-rose-500/10 p-2 rounded-xl border border-rose-500/20" title="Hapus Profil Ini">
                    🗑️ Hapus
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className={`p-2.5 rounded-xl border transition ${feedLogs.length > 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                  <span className="text-[10px] block text-slate-400">Makan</span>
                  <span className="font-semibold text-xs flex items-center mt-0.5">
                    {totalPorsiToday} Porsi 🍽️
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl border transition ${currentPet.waterGiven ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-sky-500/10 border-sky-500/30 text-sky-300'}`}>
                  <span className="text-[10px] block text-slate-400">Air Minum</span>
                  <span className="font-semibold text-xs flex items-center mt-0.5">
                    {currentPet.waterGiven ? '✅ Fresh' : '💧 Cek'}
                  </span>
                </div>

                <div className={`p-2.5 rounded-xl border transition ${currentPet.vitaminGiven ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-300'}`}>
                  <span className="text-[10px] block text-slate-400">Vitamin</span>
                  <span className="font-semibold text-xs flex items-center mt-0.5">
                    {currentPet.vitaminGiven ? '✅ Selesai' : '⚠️ Belum'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">🩺 Jurnal Kesehatan & Milestone</h3>
                <button onClick={() => setIsEditingJournal(!isEditingJournal)} className="text-xs text-emerald-400 hover:underline">
                  {isEditingJournal ? 'Tutup' : '✏️ Edit'}
                </button>
              </div>

              {isEditingJournal ? (
                <form onSubmit={handleSaveJournal} className="space-y-3 pt-2 border-t border-slate-800">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Estimasi Umur</label>
                    <input type="text" value={tempJournal.estimatedAge} onChange={(e) => setTempJournal({...tempJournal, estimatedAge: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Terakhir Mandi</label>
                    <input type="text" value={tempJournal.lastBath} onChange={(e) => setTempJournal({...tempJournal, lastBath: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100" />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Terakhir Obat Cacing</label>
                    <input type="text" value={tempJournal.lastDeworm} onChange={(e) => setTempJournal({...tempJournal, lastDeworm: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-100" />
                  </div>
                  <button type="submit" className="w-full py-2 bg-emerald-500 text-slate-950 text-xs font-semibold rounded-lg">Simpan</button>
                </form>
              ) : (
                <div className="space-y-2.5 text-sm">
                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-xs">Estimasi Umur</span>
                    <span className="font-medium text-emerald-400 text-xs">{currentPet.estimatedAge}</span>
                  </div>
                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-slate-400 text-xs block">Terakhir Mandi</span>
                      <span className="font-medium text-slate-200 text-xs">{currentPet.lastBath}</span>
                    </div>
                    <button onClick={handleBathDone} className="text-[10px] bg-sky-500/20 text-sky-300 px-2.5 py-1 rounded-lg border border-sky-500/30">
                      💦 Baru Mandi
                    </button>
                  </div>
                  <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span className="text-slate-400 text-xs">Terakhir Obat Cacing</span>
                    <span className="font-medium text-slate-200 text-xs">{currentPet.lastDeworm}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Inventaris Stok Spesifik Per Hewan */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">📦 Stok Makanan & Vitamin ({currentPet.name})</h3>
              
              {foodItems.length === 0 ? (
                <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl text-center text-xs text-rose-300">
                  ⚠️ Stok Kosong! Tombol makan & vitamin terkunci.
                </div>
              ) : (
                <div className="space-y-3">
                  {foodItems.map((item) => (
                    <div key={item.id} className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center">
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="text-xs font-semibold text-slate-200">{item.name}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${item.type === 'vitamin' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>
                            {item.type === 'vitamin' ? '💊 Vitamin' : '🍽️ Makanan'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">{item.note || '-'}</p>
                        <p className="text-lg font-bold text-emerald-400 mt-1">
                          {item.qty} <span className="text-xs text-slate-400 font-normal">{item.unit}</span>
                        </p>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <button onClick={() => handleUpdateStock(item.id, -1)} className="w-7 h-7 bg-slate-800 text-slate-200 rounded-lg text-xs font-bold border border-slate-700">-</button>
                        <button onClick={() => handleUpdateStock(item.id, 1)} className="w-7 h-7 bg-slate-800 text-slate-200 rounded-lg text-xs font-bold border border-slate-700">+</button>
                        <button onClick={() => handleDeleteFood(item.id)} className="w-7 h-7 bg-rose-500/10 text-rose-400 rounded-lg text-xs border border-rose-500/30 ml-2">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <form onSubmit={handleAddCustomFood} className="pt-3 border-t border-slate-800 space-y-2.5">
                <p className="text-xs text-slate-400 font-medium">+ Tambah Stok Khusus {currentPet.name}:</p>
                
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Nama (Mis: Cat Choize / Pisang)" value={newFoodName} onChange={(e) => setNewFoodName(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100" required />
                  <select value={newFoodType} onChange={(e) => setNewFoodType(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-xs text-slate-100">
                    <option value="food">Makanan</option>
                    <option value="vitamin">Vitamin</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Jumlah Takaran" value={newFoodQty} onChange={(e) => setNewFoodQty(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100" min="1" />
                  <input type="text" placeholder="Satuan (takaran/genggam/potong)" value={newFoodUnit} onChange={(e) => setNewFoodUnit(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100" />
                </div>

                <div>
                  <input type="text" placeholder="Catatan (Mis: 1 bungkus = 30 takaran)" value={newFoodNote} onChange={(e) => setNewFoodNote(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100" />
                </div>

                <button type="submit" className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-medium py-2 rounded-xl border border-emerald-500/30">Simpan ke Stok</button>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">Aksi Cepat Harian ({currentPet.name}) 🐾</h3>
              
              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800 space-y-2">
                <label className="text-xs text-slate-400 block">Pilih jumlah porsi / takaran yang ingin dicatat:</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFeedAmountInput(num)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${feedAmountInput === num ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md' : 'bg-slate-800 text-slate-300 border-slate-700'}`}
                    >
                      {num} Porsi
                    </button>
                  ))}
                </div>
              </div>

              {/* Tombol Kasih Makan Terkunci Otomatis Jika Stok Makanan Habis */}
              <button 
                onClick={handleFeed} 
                disabled={totalFoodQty <= 0}
                className={`w-full py-3.5 px-4 rounded-xl font-medium transition flex items-center justify-center space-x-2 ${
                  totalFoodQty <= 0 
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' 
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                }`}
              >
                <span>{totalFoodQty <= 0 ? '⚠️ Stok Makanan Kosong (Terkunci)' : `🍽️ Catat Kasih Makan (${feedAmountInput} Porsi)`}</span>
              </button>

              {feedLogs.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[11px] text-slate-400 block font-medium">Riwayat Makan Hari Ini:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {feedLogs.map((log) => (
                      <span key={log.id} className="text-[11px] bg-slate-800 text-emerald-300 px-2.5 py-1 rounded-lg border border-slate-700 flex items-center space-x-1.5">
                        <span>🕒 {log.time} ({log.amount}p)</span>
                        <button 
                          onClick={() => handleDeleteFeedLog(log.id)}
                          className="text-rose-400 hover:text-rose-300 font-bold ml-1 px-1 rounded bg-rose-500/10"
                          title="Hapus entri riwayat"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button 
                onClick={handleWater} 
                disabled={currentPet.waterGiven} 
                className={`w-full py-3 px-4 rounded-xl font-medium transition flex items-center justify-center space-x-2 ${
                  currentPet.waterGiven 
                    ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed' 
                    : 'bg-sky-600 hover:bg-sky-500 text-white shadow-lg'
                }`}
              >
                <span>{currentPet.waterGiven ? '💧 Air Minum Sudah Diganti/Dicek' : '💧 Ganti / Cek Air Minum Bersih'}</span>
              </button>

              {/* Tombol Vitamin Terkunci Otomatis Jika Stok Vitamin Habis */}
              <button 
                onClick={handleVitamin} 
                disabled={currentPet.vitaminGiven || totalVitaminQty <= 0} 
                className={`w-full py-3 px-4 rounded-xl font-medium transition flex items-center justify-center space-x-2 ${
                  currentPet.vitaminGiven || totalVitaminQty <= 0
                    ? 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed' 
                    : 'bg-teal-600 hover:bg-teal-500 text-white shadow-lg'
                }`}
              >
                <span>
                  {currentPet.vitaminGiven 
                    ? '✅ Vitamin Selesai' 
                    : totalVitaminQty <= 0 
                    ? '⚠️ Stok Vitamin Kosong (Terkunci)' 
                    : '💊 Beri Vitamin / Suplemen'}
                </span>
              </button>

              <button onClick={handleResetDay} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700">
                🔄 Selesaikan Hari Ini (Kirim ke Kalender Log)
              </button>
            </div>

          </div>
        )}

        {/* ================= TAB 2: KALENDER LOG ================= */}
        {activeTab === 'history' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">📅 Kalender & Riwayat Harian ({currentPet.name})</h3>
            
            {historyList.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                Belum ada riwayat hari sebelumnya. Klik tombol "Selesaikan Hari Ini" di dashboard untuk merekap data harian!
              </div>
            ) : (
              <div className="space-y-3">
                {historyList.map((day, index) => (
                  <div key={index} className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-emerald-400">{day.date}</span>
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">
                        Total: {day.totalFeed} Porsi
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex flex-wrap gap-1">
                      {(day.logs || []).map((l, i) => (
                        <span key={i} className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {l.time} ({l.amount}p)
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: SETTINGS ================= */}
        {activeTab === 'settings' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">⚙️ Pengaturan & Backup Data</h3>
            <p className="text-xs text-slate-400">Amankan seluruh data anabul dan stok makanan kamu dengan mengunduhnya ke file JSON, atau pulihkan kembali kapan saja.</p>

            <div className="space-y-3 pt-2">
              <button onClick={handleExportBackup} className="w-full py-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold text-xs rounded-xl border border-emerald-500/30 transition">
                📥 Download Backup Data (JSON)
              </button>

              <button onClick={() => restoreFileRef.current.click()} className="w-full py-3 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 font-semibold text-xs rounded-xl border border-sky-500/30 transition">
                📤 Pulihkan Data (Restore JSON)
              </button>
              <input type="file" ref={restoreFileRef} onChange={handleImportBackup} accept=".json" className="hidden" />
            </div>
          </div>
        )}

      </div>

      {showAddPetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-emerald-400">Tambah Anabul / Hewan Baru 🐾</h3>
            <form onSubmit={handleAddPet} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nama Peliharaan</label>
                <input type="text" value={newPetName} onChange={(e) => setNewPetName(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100" placeholder="Mis: Kucing Miko" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Jenis Hewan</label>
                <select value={newPetSpecies} onChange={(e) => setNewPetSpecies(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100">
                  <option value="Musang / Civet">Musang / Civet</option>
                  <option value="Kucing / Cat">Kucing / Cat</option>
                  <option value="Anjing / Dog">Anjing / Dog</option>
                  <option value="Hamster / Rodent">Hamster / Rodent</option>
                  <option value="Burung / Bird">Burung / Bird</option>
                  <option value="Hewan Lainnya">Lainnya</option>
                </select>
              </div>
              <div className="flex space-x-2 pt-2">
                <button type="button" onClick={() => setShowAddPetModal(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 text-xs rounded-xl">Batal</button>
                <button type="submit" className="flex-1 py-2.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl">Tambah</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}