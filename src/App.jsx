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
    return [];
  });

  const [activePetId, setActivePetId] = useState(() => {
    const saved = localStorage.getItem('pawroutine_active_id');
    return saved ? Number(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAnimation, setShowAnimation] = useState(false);

  // State untuk PWA Update Notification
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState(null);

  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodQty, setNewFoodQty] = useState(1);
  const [newFoodUnit, setNewFoodUnit] = useState('sisir');
  const [newFoodType, setNewFoodType] = useState('food');
  const [newFoodNote, setNewFoodNote] = useState('');

  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [newPetName, setNewPetName] = useState('');
  const [newPetSpecies, setNewPetSpecies] = useState('Musang / Civet');

  const [isEditingJournal, setIsEditingJournal] = useState(false);
  const [tempJournal, setTempJournal] = useState({ estimatedAge: '', lastBath: '', lastDeworm: '' });

  const fileInputRef = useRef(null);
  const restoreFileRef = useRef(null);

  const currentPet = pets.find(p => p.id === activePetId) || pets[0];

  // PWA Service Worker Listener untuk Update Button
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setUpdateAvailable(true);
        }

        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  setWaitingWorker(installingWorker);
                  setUpdateAvailable(true);
                }
              }
            };
          }
        };
      });
    }
  }, []);

  const handleUpdateApp = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
    window.location.reload();
  };

  // Auto-reset harian berdasarkan tanggal
  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const lastOpenedDate = localStorage.getItem('pawroutine_last_date');

    if (lastOpenedDate && lastOpenedDate !== todayKey) {
      setPets(prevPets => prevPets.map(p => {
        const logs = p.feedLogToday || [];
        if (logs.length > 0 || p.waterGiven || p.vitaminGiven) {
          const dateObj = new Date(lastOpenedDate);
          const formattedDateStr = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
          
          const daySummary = { 
            id: Date.now() + Math.random(), 
            date: formattedDateStr, 
            totalFeed: logs.length, 
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
    }
    localStorage.setItem('pawroutine_last_date', todayKey);
  }, []);

  useEffect(() => {
    localStorage.setItem('pawroutine_pets', JSON.stringify(pets));
  }, [pets]);

  useEffect(() => {
    if (activePetId !== null) {
      localStorage.setItem('pawroutine_active_id', activePetId);
    }
  }, [activePetId]);

  useEffect(() => {
    if (currentPet) {
      setTempJournal({
        estimatedAge: currentPet.estimatedAge || '',
        lastBath: currentPet.lastBath || '',
        lastDeworm: currentPet.lastDeworm || ''
      });
    }
  }, [activePetId, pets]);

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
    if (file && currentPet) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPets(prev => prev.map(p => p.id === activePetId ? { ...p, photo: reader.result } : p));
      };
      reader.readAsDataURL(file);
    }
  };

  const foodItems = currentPet ? (currentPet.foodList || []) : [];
  
  const totalPortionsQty = foodItems
    .filter(i => i.type === 'food' || !i.type)
    .reduce((acc, item) => acc + (item.totalPortions !== undefined ? item.totalPortions : item.qty * 12), 0);

  const totalVitaminQty = foodItems.filter(i => i.type === 'vitamin').reduce((acc, item) => acc + item.qty, 0);

  const handleFeed = (jumlahBuah = 1) => {
    if (totalPortionsQty <= 0) {
      alert("Stok makanan habis! Silakan tambah stok terlebih dahulu.");
      return;
    }

    playCuteSound();
    setShowAnimation(true);
    setTimeout(() => setShowAnimation(false), 2000);

    // Format Jam 24 Jam (id-ID dengan hour12: false)
    const currentTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
    const labelMakan = currentPet.species === 'Musang / Civet' ? `${jumlahBuah} Buah` : `${jumlahBuah} Porsi`;
    const newLog = { id: Date.now(), time: currentTime, amount: jumlahBuah, label: labelMakan };

    setPets(prev => prev.map(p => {
      if (p.id === activePetId) {
        let remainingToSubtract = jumlahBuah;
        const updatedFoodList = (p.foodList || []).map(item => {
          if ((item.type === 'food' || !item.type) && remainingToSubtract > 0) {
            const currentPortions = item.totalPortions !== undefined ? item.totalPortions : item.qty * 12;
            const take = Math.min(currentPortions, remainingToSubtract);
            remainingToSubtract -= take;
            
            const newTotalPortions = Math.max(0, currentPortions - take);
            const initialPortions = item.totalPortions !== undefined ? (item.qty * (item.totalPortions / Math.max(0.1, item.qty))) : (item.qty * 12);
            const ratio = initialPortions > 0 ? (newTotalPortions / initialPortions) : 0;
            const newPhysicalQty = item.qty * ratio;

            return { 
              ...item, 
              totalPortions: newTotalPortions,
              qty: Number(Math.max(0, newPhysicalQty).toFixed(2))
            };
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
    const todayFormatted = 'Baru saja (Hari ini)';
    setPets(prev => prev.map(p => p.id === activePetId ? { ...p, lastBath: todayFormatted } : p));
    setTempJournal(prev => ({ ...prev, lastBath: todayFormatted }));
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
    setPets(prev => {
      const updated = [...prev, newPetObj];
      if (activePetId === null) {
        setActivePetId(newPetObj.id);
      }
      return updated;
    });
    setNewPetName('');
    setShowAddPetModal(false);
  };

  const handleDeletePet = (id) => {
    if (window.confirm("Hapus profil anabul ini?")) {
      const remaining = pets.filter(p => p.id !== id);
      setPets(remaining);
      if (remaining.length > 0) {
        setActivePetId(remaining[0].id);
      } else {
        setActivePetId(null);
      }
    }
  };

  const handleResetDay = () => {
    const todayStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
    
    setPets(prev => prev.map(p => {
      if (p.id === activePetId) {
        const logs = p.feedLogToday || [];
        const totalPorsi = logs.length;
        const daySummary = { 
          id: Date.now(), 
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

  const handleRestoreHistoryDay = (historyId) => {
    if (!window.confirm("Batalkan rekap hari ini dan kembalikan log ke Dashboard?")) return;

    setPets(prev => prev.map(p => {
      if (p.id === activePetId) {
        const targetDay = (p.historyDays || []).find(d => d.id === historyId);
        if (!targetDay) return p;

        const updatedHistory = (p.historyDays || []).filter(d => d.id !== historyId);
        const restoredLogs = [...targetDay.logs, ...(p.feedLogToday || [])];

        return {
          ...p,
          feedLogToday: restoredLogs,
          vitaminGiven: targetDay.vitamin || p.vitaminGiven,
          waterGiven: targetDay.water || p.waterGiven,
          historyDays: updatedHistory
        };
      }
      return p;
    }));
  };

  const handleAddCustomFood = (e) => {
    e.preventDefault();
    if (!newFoodName || !currentPet) return;
    
    const physicalQty = Number(newFoodQty);
    const calculatedTotalPortions = physicalQty * 12;

    setPets(prev => prev.map(p => {
      if (p.id === activePetId) {
        const existingFoodList = p.foodList || [];
        const existingIndex = existingFoodList.findIndex(
          item => item.name.trim().toLowerCase() === newFoodName.trim().toLowerCase() && item.type === newFoodType
        );

        if (existingIndex > -1) {
          const updatedList = [...existingFoodList];
          const targetItem = updatedList[existingIndex];
          const newQty = targetItem.qty + physicalQty;
          const newTotalPortions = (targetItem.totalPortions !== undefined ? targetItem.totalPortions : targetItem.qty * 12) + calculatedTotalPortions;

          updatedList[existingIndex] = {
            ...targetItem,
            qty: newQty,
            totalPortions: newTotalPortions,
            note: newFoodNote ? newFoodNote : targetItem.note
          };
          return { ...p, foodList: updatedList };
        } else {
          const newItem = { 
            id: Date.now(), 
            name: newFoodName, 
            qty: physicalQty, 
            unit: newFoodUnit, 
            totalPortions: calculatedTotalPortions,
            type: newFoodType, 
            note: newFoodNote 
          };
          return { ...p, foodList: [...existingFoodList, newItem] };
        }
      }
      return p;
    }));

    setNewFoodName('');
    setNewFoodQty(1);
    setNewFoodNote('');
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
            if (data.pets.length > 0) setActivePetId(data.pets[0].id);
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

  const feedLogs = currentPet ? (currentPet.feedLogToday || []) : [];
  const totalMakanHariIni = feedLogs.length;
  const historyList = currentPet ? (currentPet.historyDays || []) : [];
  const isMusang = currentPet?.species === 'Musang / Civet';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 sm:p-8 font-sans pb-28 relative overflow-x-hidden">
      
      {/* Tombol Update Now PWA */}
      {updateAvailable && (
        <div className="fixed top-4 z-50 animate-bounce">
          <button
            onClick={handleUpdateApp}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-300 flex items-center space-x-2 transition active:scale-95"
          >
            <span>🚀 Update Versi Baru Tersedia! Klik Di Sini</span>
          </button>
        </div>
      )}

      {/* ANIMASI GAYA "Floating Emoji & Scale Burst" (Pop-Up Meledak Ceria) */}
      {showAnimation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-fade-in p-4">
          <div className="bg-slate-900 border border-emerald-500/40 p-6 rounded-3xl shadow-2xl text-center space-y-4 max-w-xs w-full animate-bounce">
            <div className="relative w-20 h-20 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 overflow-hidden flex items-center justify-center text-4xl shadow-inner">
              <span className="absolute -top-3 -right-2 text-2xl animate-ping">✨</span>
              <span className="absolute -bottom-2 -left-2 text-2xl animate-bounce">
                {currentPet?.species === 'Musang / Civet' ? '🍌' : '🐟'}
              </span>
              {currentPet?.photo ? (
                <img src={currentPet.photo} alt="Anabul" className="w-full h-full object-cover" />
              ) : (
                <span>🐾</span>
              )}
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-emerald-400">Nyem-nyem! {currentPet?.name} Lahap Banget 🥳</h2>
              <p className="text-xs text-slate-300">Porsi makan berhasil dicatat & stok terupdate.</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-md w-full space-y-6">
        
        {/* Header atas */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold text-emerald-400 tracking-wide">PawRoutine 🐾</h1>
              <p className="text-xs text-slate-400">Multi-Pet PWA Routine & Alarm Tracker</p>
            </div>
            <button 
              onClick={() => setShowAddPetModal(true)}
              className="text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3.5 py-2 rounded-xl shadow transition active:scale-95"
            >
              + Anabul Baru
            </button>
          </div>

          {pets.length > 0 && (
            <div className="flex space-x-2 overflow-x-auto pb-1 pt-1">
              {pets.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActivePetId(p.id)}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                    activePetId === p.id 
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-bold' 
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  <span>{p.photo ? '📸' : '🐾'}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {pets.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-8 text-center space-y-4 shadow-xl backdrop-blur-sm">
            <span className="text-5xl block">🐾</span>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-emerald-400">Belum Ada Anabul</h2>
              <p className="text-xs text-slate-400">Silakan tambahkan peliharaan pertama kamu melalui tombol di atas.</p>
            </div>
          </div>
        ) : (
          <>
            {/* ================= TAB 1: DASHBOARD ================= */}
            {activeTab === 'dashboard' && currentPet && (
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

                    <button onClick={() => handleDeletePet(currentPet.id)} className="text-xs text-rose-400 hover:bg-rose-500/10 p-2 rounded-xl border border-rose-500/20" title="Hapus Profil Ini">
                      🗑️ Hapus
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className={`p-2.5 rounded-xl border transition ${feedLogs.length > 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
                      <span className="text-[10px] block text-slate-400">Makan Hari Ini</span>
                      <span className="font-semibold text-xs flex items-center mt-0.5">
                        {totalMakanHariIni} Kali 🍽️
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

                {/* AKSI CEPAT HARIAN */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-xl space-y-3.5 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">⚡ Aksi Cepat ({currentPet.name})</h3>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700/50">
                      {isMusang ? '🐾 Mode Musang' : '✨ Standard'}
                    </span>
                  </div>
                  
                  {isMusang ? (
                    <div className="space-y-2 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/60">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-medium">🍌 Beri Makan Pisang:</span>
                        <span className="text-[10px] text-emerald-400 font-semibold">{totalPortionsQty} Porsi sisa</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={() => handleFeed(1)} 
                          disabled={totalPortionsQty <= 0}
                          className="py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition active:scale-95 flex flex-col items-center justify-center"
                        >
                          <span>🍌 1 Buah</span>
                        </button>
                        <button 
                          onClick={() => handleFeed(2)} 
                          disabled={totalPortionsQty <= 0}
                          className="py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition active:scale-95 flex flex-col items-center justify-center"
                        >
                          <span>🍌 2 Buah</span>
                        </button>
                        <button 
                          onClick={() => handleFeed(3)} 
                          disabled={totalPortionsQty <= 0}
                          className="py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/10 transition active:scale-95 flex flex-col items-center justify-center"
                        >
                          <span>🍌 3 Buah</span>
                        </button>
                      </div>
                      {totalPortionsQty <= 0 && (
                        <p className="text-[10px] text-rose-400 text-center">⚠️ Stok makanan habis! Tambahkan stok di bawah.</p>
                      )}
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleFeed(1)} 
                      disabled={totalPortionsQty <= 0}
                      className={`w-full py-3.5 px-4 rounded-2xl font-bold transition flex items-center justify-center space-x-2 shadow-lg active:scale-98 ${
                        totalPortionsQty <= 0 
                          ? 'bg-slate-800 text-slate-600 border border-slate-700/50 cursor-not-allowed' 
                          : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20'
                      }`}
                    >
                      <span>{totalPortionsQty <= 0 ? '⚠️ Stok Makanan Habis (Terkunci)' : '🍽️ Catat Kasih Makan'}</span>
                    </button>
                  )}

                  {feedLogs.length > 0 && (
                    <div className="pt-1 space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-medium block">Log Makan Hari Ini:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {feedLogs.map((log) => (
                          <span key={log.id} className="text-[11px] bg-slate-950 text-emerald-300 px-3 py-1 rounded-xl border border-slate-800 flex items-center space-x-2 shadow-inner">
                            <span>🕒 {log.time}</span>
                            <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold">{log.label || '1 Porsi'}</span>
                            <button 
                              onClick={() => handleDeleteFeedLog(log.id)}
                              className="text-rose-400 hover:text-rose-300 font-bold ml-0.5 px-1 rounded bg-rose-500/10"
                              title="Hapus"
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tombol Air Minum */}
                  <button 
                    onClick={handleWater} 
                    disabled={currentPet.waterGiven} 
                    className={`w-full py-3.5 px-4 rounded-2xl font-semibold text-xs transition flex items-center justify-between shadow-lg active:scale-98 ${
                      currentPet.waterGiven 
                        ? 'bg-slate-950/60 text-slate-500 border border-slate-800/80 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white shadow-sky-500/20 border border-sky-400/30'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-base">💧</span>
                      <div className="text-left">
                        <p className="font-bold text-xs">{currentPet.waterGiven ? 'Air Minum Sudah Diganti Baru' : 'Ganti Air / Cuci Mangkok'}</p>
                        <p className="text-[10px] opacity-75">{isMusang ? 'Waspada mangkok kena pup / kotor!' : 'Jaga kesegaran air minum'}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-lg font-bold ${currentPet.waterGiven ? 'bg-slate-800 text-slate-400' : 'bg-white/20 text-white'}`}>
                      {currentPet.waterGiven ? '✅ Aman' : '🔄 Kuras'}
                    </span>
                  </button>

                  {/* Tombol Vitamin */}
                  <button 
                    onClick={handleVitamin} 
                    disabled={currentPet.vitaminGiven || totalVitaminQty <= 0} 
                    className={`w-full py-3.5 px-4 rounded-2xl font-semibold text-xs transition flex items-center justify-between shadow-lg active:scale-98 ${
                      currentPet.vitaminGiven || totalVitaminQty <= 0
                        ? 'bg-slate-950/60 text-slate-500 border border-slate-800/80 cursor-not-allowed' 
                        : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-teal-500/20 border border-teal-400/30'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-base">💊</span>
                      <div className="text-left">
                        <p className="font-bold text-xs">
                          {currentPet.vitaminGiven ? 'Vitamin Hari Ini Selesai' : totalVitaminQty <= 0 ? 'Stok Vitamin Kosong' : 'Beri Vitamin / Suplemen'}
                        </p>
                        <p className="text-[10px] opacity-75">Jaga kesehatan imun tubuh anabul</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-lg font-bold ${currentPet.vitaminGiven ? 'bg-slate-800 text-slate-400' : 'bg-white/20 text-white'}`}>
                      {currentPet.vitaminGiven ? '✅ Beres' : totalVitaminQty <= 0 ? '⚠️ Kosong' : '🚀 Siap'}
                    </span>
                  </button>

                  {/* Tombol Reset Hari Ini */}
                  <button onClick={handleResetDay} className="w-full py-2.5 bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs rounded-xl border border-slate-800/80 transition active:scale-98 flex items-center justify-center space-x-1.5">
                    <span>🔄</span>
                    <span>Selesaikan Hari Ini (Kirim ke Kalender Log)</span>
                  </button>
                </div>

                {/* JURNAL KESEHATAN & MILESTONE */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-xl space-y-4 backdrop-blur-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-base">🩺</span>
                      <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase">Jurnal Kesehatan & Milestone</h3>
                    </div>
                    <button 
                      onClick={() => setIsEditingJournal(!isEditingJournal)} 
                      className="text-xs bg-slate-800 hover:bg-slate-700 text-emerald-400 px-3 py-1.5 rounded-xl border border-slate-700/50 transition font-medium flex items-center space-x-1"
                    >
                      <span>{isEditingJournal ? '✕ Tutup' : '✏️ Edit'}</span>
                    </button>
                  </div>

                  {isEditingJournal ? (
                    <form onSubmit={handleSaveJournal} className="space-y-3 pt-2 border-t border-slate-800/80">
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Estimasi Umur</label>
                        <input type="text" value={tempJournal.estimatedAge} onChange={(e) => setTempJournal({...tempJournal, estimatedAge: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:border-emerald-500/50 outline-none" />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Terakhir Mandi</label>
                        <input type="text" value={tempJournal.lastBath} onChange={(e) => setTempJournal({...tempJournal, lastBath: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:border-emerald-500/50 outline-none" />
                      </div>
                      <div>
                        <label className="text-[11px] text-slate-400 block mb-1">Terakhir Obat Cacing</label>
                        <input type="text" value={tempJournal.lastDeworm} onChange={(e) => setTempJournal({...tempJournal, lastDeworm: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:border-emerald-500/50 outline-none" />
                      </div>
                      <button type="submit" className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow transition active:scale-98">Simpan Jurnal</button>
                    </form>
                  ) : (
                    <div className="space-y-2.5 text-xs">
                      <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80 flex justify-between items-center shadow-inner">
                        <span className="text-slate-400">Estimasi Umur</span>
                        <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">{currentPet.estimatedAge || '-'}</span>
                      </div>

                      <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80 flex justify-between items-center shadow-inner">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Terakhir Mandi</span>
                          <span className="font-semibold text-slate-200 text-sm mt-0.5 block">{currentPet.lastBath || '-'}</span>
                        </div>
                        <button 
                          onClick={handleBathDone} 
                          className="bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 border border-sky-400/30 transition active:scale-95 flex items-center space-x-1"
                        >
                          <span>💦 Baru Mandi</span>
                        </button>
                      </div>

                      <div className="bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80 flex justify-between items-center shadow-inner">
                        <span className="text-slate-400">Terakhir Obat Cacing</span>
                        <span className="font-semibold text-slate-200">{currentPet.lastDeworm || '-'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* INVENTARIS STOK MAKANAN & VITAMIN */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-3xl p-5 shadow-xl space-y-4 backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">📦</span>
                    <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase">Stok Makanan & Vitamin ({currentPet.name})</h3>
                  </div>
                  
                  {foodItems.length === 0 ? (
                    <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl text-center text-xs text-rose-300 font-medium">
                      ⚠️ Stok Kosong! Tombol makan & vitamin terkunci.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {foodItems.map((item) => (
                        <div key={item.id} className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 flex justify-between items-center shadow-inner">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <p className="text-xs font-bold text-slate-100">{item.name}</p>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${item.type === 'vitamin' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}>
                                {item.type === 'vitamin' ? '💊 Vitamin' : '🍽️ Makanan'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400">{item.note || '-'}</p>
                            <p className="text-base font-extrabold text-emerald-400 pt-0.5">
                              {item.qty} <span className="text-xs text-slate-400 font-normal">{item.unit}</span>
                            </p>
                          </div>
                          <button 
                            onClick={() => handleDeleteFood(item.id)} 
                            className="w-9 h-9 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs border border-rose-500/30 flex items-center justify-center transition active:scale-95"
                            title="Hapus Stok"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleAddCustomFood} className="pt-3 border-t border-slate-800/80 space-y-3">
                    <p className="text-xs text-slate-400 font-semibold">+ Tambah Stok Makanan Baru (Auto-Merge jika nama sama):</p>
                    
                    <div className="grid grid-cols-2 gap-2.5">
                      <input 
                        type="text" 
                        placeholder="Nama (Mis: Pisang)" 
                        value={newFoodName} 
                        onChange={(e) => setNewFoodName(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-emerald-500/50 outline-none" 
                        required 
                      />
                      <select 
                        value={newFoodType} 
                        onChange={(e) => setNewFoodType(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:border-emerald-500/50 outline-none"
                      >
                        <option value="food">Makanan</option>
                        <option value="vitamin">Vitamin</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1 font-medium">Jumlah Fisik</label>
                        <input 
                          type="number" 
                          placeholder="Mis: 1" 
                          value={newFoodQty} 
                          onChange={(e) => setNewFoodQty(e.target.value)} 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-emerald-500/50 outline-none" 
                          min="0.1" 
                          step="any" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1 font-medium">Satuan</label>
                        <input 
                          type="text" 
                          placeholder="sisir / bungkus" 
                          value={newFoodUnit} 
                          onChange={(e) => setNewFoodUnit(e.target.value)} 
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-emerald-500/50 outline-none" 
                          required 
                        />
                      </div>
                    </div>

                    <div>
                      <input 
                        type="text" 
                        placeholder="Catatan (Mis: 4 sisir pisang di kulkas)" 
                        value={newFoodNote} 
                        onChange={(e) => setNewFoodNote(e.target.value)} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:border-emerald-500/50 outline-none" 
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-500/10 transition active:scale-98"
                    >
                      + Simpan ke Stok
                    </button>
                  </form>
                </div>

              </div>
            )}

            {/* ================= TAB 2: KALENDER LOG ================= */}
            {activeTab === 'history' && currentPet && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">📅 Kalender & Riwayat Harian ({currentPet.name})</h3>
                </div>
                
                {historyList.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500">
                    Belum ada riwayat hari sebelumnya. Rekap harian akan terisi otomatis saat tanggal berganti!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {historyList.map((day) => (
                      <div key={day.id || day.date} className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-emerald-400">{day.date}</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">
                              Total: {day.totalFeed} Kali Makan
                            </span>
                            <button 
                              onClick={() => handleRestoreHistoryDay(day.id)}
                              className="text-[10px] bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30 font-medium transition"
                              title="Batalkan rekap hari ini dan kembalikan ke dashboard"
                            >
                              ↩️ Batalkan
                            </button>
                          </div>
                        </div>
                        <div className="text-[11px] text-slate-400 flex flex-wrap gap-1">
                          {(day.logs || []).map((l) => (
                            <span key={l.id} className="bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {l.time} {l.label ? `(${l.label})` : ''}
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
          </>
        )}

      </div>

      {/* ================= BOTTOM NAVIGATION BAR ================= */}
      {pets.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-2 z-45 max-w-md mx-auto shadow-2xl flex justify-around items-center">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`flex-1 py-2 flex flex-col items-center justify-center transition ${activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <span className="text-lg">🏠</span>
            <span className="text-[10px] mt-0.5">Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('history')} 
            className={`flex-1 py-2 flex flex-col items-center justify-center transition ${activeTab === 'history' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <span className="text-lg">📅</span>
            <span className="text-[10px] mt-0.5">Kalender</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')} 
            className={`flex-1 py-2 flex flex-col items-center justify-center transition ${activeTab === 'settings' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <span className="text-lg">⚙️</span>
            <span className="text-[10px] mt-0.5">Backup</span>
          </button>
        </div>
      )}

      {showAddPetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-emerald-400">Tambah Anabul / Hewan Baru 🐾</h3>
            <form onSubmit={handleAddPet} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Nama Peliharaan</label>
                <input type="text" value={newPetName} onChange={(e) => setNewPetName(e.target.value)} required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100" placeholder="Mis: Musang Jojo" />
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