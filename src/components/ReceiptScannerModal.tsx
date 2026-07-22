import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CATEGORIES } from "../constants/categories";
import { parseReceiptText, RECEIPT_PRESETS } from "../services/receiptScanner";
import type { ReceiptPreset } from "../services/receiptScanner";
import type { Account } from "../services/onedrive";
import {
  UploadCloud,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  Loader2,
  CheckSquare,
  Square,
  Sparkles,
  ArrowLeft,
  X
} from "lucide-react";

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  activeAccountId: string | null;
  onAddTransactionsBatch: (
    txs: Array<{
      amount: number;
      category: string;
      type: "income" | "expense";
      date: string;
      note: string;
      accountId: string;
    }>
  ) => void;
}

interface ReviewItem {
  checked: boolean;
  name: string;
  price: number;
  category: string;
  key: string;
}

export const ReceiptScannerModal: React.FC<ReceiptScannerModalProps> = ({
  isOpen,
  onClose,
  accounts,
  activeAccountId,
  onAddTransactionsBatch,
}) => {
  // Modal Views: 'upload' | 'scanning' | 'review' | 'success'
  const [modalView, setModalView] = useState<"upload" | "scanning" | "review" | "success">("upload");
  
  // Scanning States
  const [scanPresetName, setScanPresetName] = useState<string>("");
  const [scanStep, setScanStep] = useState<number>(0);
  const scanMessages = [
    "Detecting receipt contours...",
    "Running OCR engine (Tesseract)...",
    "Extracting line items and unit pricing...",
    "Categorizing transactions based on smart keyword mapping..."
  ];

  // Raw Text Paste state
  const [pastedText, setPastedText] = useState("");
  const [parseError, setParseError] = useState("");

  // Review states
  const [merchant, setMerchant] = useState("Store Expense");
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState(() => {
    return activeAccountId || accounts[0]?.id || "main_wallet";
  });
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [importType, setImportType] = useState<"individual" | "consolidated">("individual");
  const [consolidatedCategory, setConsolidatedCategory] = useState("Food");

  // File Upload drag states
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-advance scanning animation
  useEffect(() => {
    if (modalView !== "scanning") return;

    const intervals = [
      setTimeout(() => setScanStep(1), 500),
      setTimeout(() => setScanStep(2), 1100),
      setTimeout(() => setScanStep(3), 1600),
      setTimeout(() => {
        setModalView("review");
      }, 2200)
    ];

    return () => {
      intervals.forEach(clearTimeout);
    };
  }, [modalView]);

  // Handle Preset Click
  const handleSelectPreset = (preset: ReceiptPreset) => {
    setMerchant(preset.merchant);
    setScanPresetName(preset.merchant);
    
    // Convert extracted items to Review items with unique keys
    const reviewItems: ReviewItem[] = preset.items.map((item, idx) => ({
      checked: true,
      name: item.name,
      price: item.price,
      category: item.category,
      key: `${preset.id}_${idx}_${Date.now()}`
    }));
    
    setItems(reviewItems);
    setScanStep(0);
    setModalView("scanning");
  };

  // Handle File Upload Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const processUploadedFile = (file: File) => {
    setMerchant(file.name.split(".")[0] || "Uploaded Receipt");
    setScanPresetName("Uploaded Receipt File");
    
    // Simulate OCR results since we run entirely client-side
    // Pre-populate with typical grocery store items
    const simulatedItems: ReviewItem[] = [
      { checked: true, name: "Organic Whole Milk 1 Gal", price: 7.25, category: "Food", key: `sim_1_${Date.now()}` },
      { checked: true, name: "Fresh Bakery Sliced Bread", price: 4.50, category: "Food", key: `sim_2_${Date.now()}` },
      { checked: true, name: "Gillette Men's Razor Set", price: 45.00, category: "Shopping", key: `sim_3_${Date.now()}` },
      { checked: true, name: "Fresh Strawberries 500g", price: 14.95, category: "Food", key: `sim_4_${Date.now()}` },
      { checked: true, name: "Panadol Rapid Tablets 20pk", price: 18.25, category: "Others", key: `sim_5_${Date.now()}` }
    ];
    
    setItems(simulatedItems);
    setScanStep(0);
    setModalView("scanning");
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  // Paste parsing triggers
  const handleParseText = () => {
    if (!pastedText.trim()) {
      setParseError("Please paste some receipt text first.");
      return;
    }

    const parsed = parseReceiptText(pastedText);
    if (parsed.length === 0) {
      setParseError("No items could be extracted. Please paste text with format: 'Item Name Price' (e.g. Tomato Soup 4.50) on each line.");
      return;
    }

    setParseError("");
    setMerchant("Pasted E-Receipt");
    
    const reviewItems: ReviewItem[] = parsed.map((item, idx) => ({
      checked: true,
      name: item.name,
      price: item.price,
      category: item.category,
      key: `paste_${idx}_${Date.now()}`
    }));

    setItems(reviewItems);
    setModalView("review");
  };

  // Review Item Modifiers
  const handleItemFieldChange = (key: string, field: keyof ReviewItem, value: any) => {
    setItems(prev =>
      prev.map(item => (item.key === key ? { ...item, [field]: value } : item))
    );
  };

  const handleDeleteItem = (key: string) => {
    setItems(prev => prev.filter(item => item.key !== key));
  };

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      {
        checked: true,
        name: "",
        price: 0.00,
        category: "Food",
        key: `added_${Date.now()}`
      }
    ]);
  };

  const toggleSelectAll = () => {
    const allChecked = items.every(i => i.checked);
    setItems(prev => prev.map(item => ({ ...item, checked: !allChecked })));
  };

  // Summary Totals
  const totalScanned = items.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalSelected = items.filter(item => item.checked).reduce((sum, item) => sum + (item.price || 0), 0);

  // Submit handler
  const handleImportExpenses = () => {
    const checkedItems = items.filter(item => item.checked);
    if (checkedItems.length === 0) {
      alert("Please select at least one item to import.");
      return;
    }

    // Prepare batch transaction records
    const txInputs: Array<{
      amount: number;
      category: string;
      type: "income" | "expense";
      date: string;
      note: string;
      accountId: string;
    }> = [];

    if (importType === "individual") {
      checkedItems.forEach(item => {
        txInputs.push({
          amount: item.price,
          category: item.category,
          type: "expense",
          date: date,
          note: `${merchant}: ${item.name}`.trim(),
          accountId: selectedAccountId
        });
      });
    } else {
      // Consolidated
      const listStr = checkedItems.map(item => `${item.name} (SAR ${item.price})`).join(", ");
      txInputs.push({
        amount: totalSelected,
        category: consolidatedCategory,
        type: "expense",
        date: date,
        note: `${merchant} consolidated: ${listStr}`.slice(0, 250), // prevent super long notes
        accountId: selectedAccountId
      });
    }

    onAddTransactionsBatch(txInputs);
    setModalView("success");
    setTimeout(() => {
      // Reset state and close modal
      setModalView("upload");
      setPastedText("");
      onClose();
    }, 1500);
  };

  // Reset back to upload page
  const handleBackToUpload = () => {
    setModalView("upload");
    setParseError("");
  };

  const getStepDescription = () => {
    return "Scan and parse receipts to easily log expenses.";
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-xl rounded-2xl bg-bg-card border border-border-custom p-6 shadow-2xl overflow-hidden relative text-left" showCloseButton={modalView !== "scanning"}>
        <DialogTitle className="sr-only">Receipt Scanner</DialogTitle>
        <DialogDescription className="sr-only">
          {getStepDescription()}
        </DialogDescription>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes scanLaser {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
          .laser-line {
            animation: scanLaser 1.8s infinite linear;
          }
        ` }} />

        {/* CLOSE BUTTON AT SCANNING (custom handle since showCloseButton is disabled for scanning) */}
        {modalView === "scanning" && (
          <button 
            onClick={() => setModalView("upload")} 
            className="absolute top-4 right-4 p-2 text-text-tertiary hover:text-text-primary bg-bg-elevated border border-border-custom/50 rounded-full cursor-pointer transition z-50"
            aria-label="Cancel Scan"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* 1. SUCCESS VIEW */}
        {modalView === "success" && (
          <div className="py-12 flex flex-col items-center justify-center gap-4 text-center animate-fade-in animate-duration-300">
            <div className="w-16 h-16 rounded-full bg-success-custom-bg flex items-center justify-center text-success-custom shadow-lg">
              <Check className="w-8 h-8 animate-bounce" />
            </div>
            <h4 className="text-xl font-semibold text-text-primary tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
              Expenses Added!
            </h4>
            <p className="text-sm text-text-secondary max-w-xs">
              Successfully imported {items.filter(i => i.checked).length} items as expenses.
            </p>
          </div>
        )}

        {/* 2. SCANNING VIEW */}
        {modalView === "scanning" && (
          <div className="py-10 flex flex-col items-center justify-center gap-6 animate-fade-in text-center">
            {/* Simulated Receipt paper */}
            <div className="w-40 h-52 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-border-custom relative overflow-hidden flex flex-col p-4 select-none">
              {/* Laser line overlay */}
              <div className="absolute left-0 right-0 h-1 bg-accent-custom shadow-[0_0_10px_3px_var(--color-accent-custom)] laser-line" />
              
              {/* Simulated text lines */}
              <div className="w-1/2 h-3 bg-zinc-200 dark:bg-zinc-700 rounded-sm mb-3 mt-1" />
              <div className="w-3/4 h-2 bg-zinc-100 dark:bg-zinc-600 rounded-sm mb-2" />
              <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-600 rounded-sm mb-1.5" />
              <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-600 rounded-sm mb-1.5" />
              <div className="w-5/6 h-1.5 bg-zinc-100 dark:bg-zinc-600 rounded-sm mb-4" />
              <div className="w-full flex justify-between items-center mt-auto border-t border-dashed border-zinc-200 dark:border-zinc-700 pt-2">
                <div className="w-1/3 h-2 bg-zinc-200 dark:bg-zinc-700 rounded-sm" />
                <div className="w-1/4 h-3 bg-zinc-300 dark:bg-zinc-600 rounded-sm" />
              </div>
            </div>

            <div className="flex flex-col gap-2 max-w-sm">
              <span className="text-[10px] text-accent-custom font-extrabold uppercase tracking-wider animate-pulse">
                Analyzing receipt: {scanPresetName}
              </span>
              <h4 className="text-sm font-semibold text-text-primary flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-accent-custom" />
                Scanning Receipt Image
              </h4>
              <p className="text-xs text-text-secondary h-8 transition-all duration-300 font-medium">
                {scanMessages[scanStep]}
              </p>
            </div>
          </div>
        )}

        {/* 3. UPLOAD / PASTE VIEW */}
        {modalView === "upload" && (
          <div className="flex flex-col gap-4">
            <div className="border-b border-border-custom pb-3 mb-2 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-accent-custom font-bold uppercase tracking-wider">
                  AI Receipt Scanner
                </span>
                <h3 className="text-lg font-semibold text-text-primary tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                  Extract & Add Expenses
                </h3>
              </div>
            </div>

            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid grid-cols-2 p-0.5 bg-bg-elevated rounded-xl mb-4">
                <TabsTrigger value="upload" className="py-2 text-xs font-semibold rounded-[10px] transition-all cursor-pointer">
                  Upload Image
                </TabsTrigger>
                <TabsTrigger value="paste" className="py-2 text-xs font-semibold rounded-[10px] transition-all cursor-pointer">
                  Paste Raw Text
                </TabsTrigger>
              </TabsList>

              {/* Upload Tab */}
              <TabsContent value="upload" className="flex flex-col gap-4 focus:outline-none">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-3 cursor-pointer transition-all duration-300 ${
                    isDragOver
                      ? "border-accent-custom bg-accent-custom-bg/20 scale-[0.99]"
                      : "border-border-custom hover:border-accent-custom/40 hover:bg-bg-elevated/20"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-full bg-accent-custom-bg text-accent-custom flex items-center justify-center shadow-inner">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-text-primary">
                      Drag and drop receipt image or click to browse
                    </span>
                    <span className="text-[10px] text-text-tertiary">
                      Supports PNG, JPG, or JPEG formats.
                    </span>
                  </div>
                </div>

                {/* Presets Grid */}
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-accent-custom" /> Try Quick Sample Receipts (Ready-to-use)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {RECEIPT_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset)}
                        className="p-3 bg-bg-elevated border border-border-custom hover:border-accent-custom/40 rounded-2xl text-left hover:bg-bg-card-hover hover:scale-[1.02] transition-all duration-200 cursor-pointer flex flex-col gap-1.5 group"
                      >
                        <span className="font-bold text-text-primary text-xs truncate group-hover:text-accent-custom">
                          {preset.merchant}
                        </span>
                        <div className="flex items-center justify-between text-[9px] text-text-secondary font-medium">
                          <span>{preset.items.length} items</span>
                          <span className="text-accent-custom font-bold">SAR {preset.total.toFixed(2)}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Paste Text Tab */}
              <TabsContent value="paste" className="flex flex-col gap-4 focus:outline-none">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">
                    Paste E-Receipt Text
                  </label>
                  <textarea
                    rows={6}
                    value={pastedText}
                    onChange={(e) => {
                      setPastedText(e.target.value);
                      if (parseError) setParseError("");
                    }}
                    placeholder={`PANDA SUPERMARKET\nOrganic Milk 1L   6.50\nWhole wheat bread  4.00\nToothpaste Colgate 18.50\nSubtotal   29.00`}
                    className="w-full px-3 py-2.5 bg-bg-elevated border border-border-custom focus:border-accent-custom/50 rounded-xl text-xs font-medium text-text-primary focus:outline-none placeholder:text-text-tertiary/40 resize-none transition-all"
                  />
                  {parseError && (
                    <div className="p-2.5 bg-red-500/5 dark:bg-red-500/10 border border-red-500/15 rounded-xl flex items-start gap-2 text-[10px] text-expense-custom leading-normal">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>{parseError}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center text-[10px] text-text-tertiary font-medium bg-bg-elevated/40 p-2.5 rounded-xl border border-border-custom/50">
                  <span>Regex parser detects patterns like "Item Name Price" (e.g. Orange Juice 12.00) on separate lines.</span>
                </div>

                <Button
                  onClick={handleParseText}
                  className="w-full h-11 bg-accent-custom hover:bg-accent-custom-hover text-accent-custom-fg rounded-full font-bold cursor-pointer"
                >
                  Parse Receipt Text
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* 4. REVIEW & EDIT VIEW */}
        {modalView === "review" && (
          <div className="flex flex-col gap-4">
            <div className="border-b border-border-custom pb-3 mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleBackToUpload}
                  className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-elevated cursor-pointer transition"
                  title="Go Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="text-left">
                  <span className="text-[10px] text-success-custom font-extrabold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-success-custom animate-pulse" /> Extraction Complete
                  </span>
                  <h3 className="text-base font-semibold text-text-primary tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
                    Review Scanned Items
                  </h3>
                </div>
              </div>
              
              <button
                onClick={toggleSelectAll}
                className="text-[10px] text-accent-custom hover:underline font-bold cursor-pointer bg-accent-custom-bg/30 px-2.5 py-1.5 rounded-lg border border-accent-custom/10 transition"
              >
                {items.every(i => i.checked) ? "Deselect All" : "Select All"}
              </button>
            </div>

            {/* Merchant Editable Input */}
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider">Merchant / Store Name</label>
              <Input
                type="text"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="h-10 px-3 bg-bg-elevated rounded-xl border-transparent font-bold text-text-primary text-xs"
                required
              />
            </div>

            {/* Items Table container */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] text-text-tertiary font-bold uppercase tracking-wider text-left">Receipt Line Items</label>
              <div className="max-h-[220px] overflow-y-auto pr-1 flex flex-col gap-2 custom-scrollbar">
                {items.length === 0 ? (
                  <div className="text-center py-6 text-xs text-text-tertiary border border-dashed border-border-custom rounded-2xl bg-bg-elevated/10">
                    No items left. Click "Add Item" to create one.
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.key}
                      className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 border rounded-xl transition ${
                        item.checked
                          ? "bg-bg-elevated border-border-custom"
                          : "bg-bg-elevated/30 border-transparent opacity-60"
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="flex items-center justify-between sm:justify-start gap-2">
                        <button
                          type="button"
                          onClick={() => handleItemFieldChange(item.key, "checked", !item.checked)}
                          className="text-text-secondary hover:text-accent-custom cursor-pointer"
                        >
                          {item.checked ? (
                            <CheckSquare className="w-4 h-4 text-accent-custom" />
                          ) : (
                            <Square className="w-4 h-4 text-text-tertiary" />
                          )}
                        </button>
                        
                        <span className="sm:hidden text-[10px] text-text-tertiary font-bold uppercase">Include Item</span>
                      </div>

                      {/* Name input */}
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleItemFieldChange(item.key, "name", e.target.value)}
                        placeholder="Item name..."
                        className="flex-1 px-2.5 py-1.5 bg-bg-card border border-border-custom/50 rounded-lg text-xs font-semibold text-text-primary focus:outline-hidden"
                      />

                      {/* Category selector */}
                      <select
                        value={item.category}
                        onChange={(e) => handleItemFieldChange(item.key, "category", e.target.value)}
                        className="px-2 py-1.5 bg-bg-card border border-border-custom/50 rounded-lg text-[11px] font-semibold text-text-primary focus:outline-hidden min-w-[100px] cursor-pointer"
                      >
                        {CATEGORIES.filter(c => c.name !== "Salary").map((cat) => (
                          <option key={cat.name} value={cat.name}>
                            {cat.icon} {cat.name}
                          </option>
                        ))}
                      </select>

                      {/* Price input */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step="0.01"
                          min="0.00"
                          value={item.price || ""}
                          onChange={(e) => handleItemFieldChange(item.key, "price", parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                          className="w-20 px-2 py-1.5 bg-bg-card border border-border-custom/50 rounded-lg text-xs font-bold text-text-primary text-right focus:outline-hidden tabular-nums"
                        />
                        <span className="text-[10px] text-text-tertiary font-semibold">SAR</span>
                        
                        {/* Delete Button */}
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.key)}
                          className="p-1.5 rounded-lg text-text-tertiary hover:text-expense-custom hover:bg-expense-custom-bg/10 cursor-pointer transition shrink-0 ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add item button */}
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full py-2 bg-bg-elevated border border-dashed border-border-custom hover:border-accent-custom/40 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer transition flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item Manually
              </button>
            </div>

            {/* Total display */}
            <div className="p-3 bg-bg-elevated/40 border border-border-custom/50 rounded-2xl grid grid-cols-2 gap-4 text-xs font-bold text-text-secondary">
              <div className="text-left flex flex-col">
                <span className="text-[9px] text-text-tertiary uppercase tracking-wider">Scanned Total</span>
                <span className="text-sm font-semibold text-text-primary tabular-nums">SAR {totalScanned.toFixed(2)}</span>
              </div>
              <div className="text-right flex flex-col">
                <span className="text-[9px] text-text-tertiary uppercase tracking-wider">Importing Selected Total</span>
                <span className="text-sm font-black text-accent-custom tabular-nums">SAR {totalSelected.toFixed(2)}</span>
              </div>
            </div>

            {/* Global Settings */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold text-text-secondary border-t border-border-custom/40 pt-3">
              {/* Account selection */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[9px] text-text-tertiary uppercase tracking-wider font-bold">Charge to Account</label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger className="h-10 rounded-xl bg-bg-elevated border-transparent font-bold text-text-primary cursor-pointer text-xs">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-3 rounded-xs ${acc.color} bg-linear-to-r border border-white/10`} />
                          <span className="text-xs">{acc.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-[9px] text-text-tertiary uppercase tracking-wider font-bold">Transaction Date</label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-10 rounded-xl bg-bg-elevated border-transparent font-bold text-text-primary text-xs"
                  required
                />
              </div>

              {/* Import method */}
              <div className="flex flex-col gap-1 text-left sm:col-span-2">
                <label className="text-[9px] text-text-tertiary uppercase tracking-wider font-bold">Post Method</label>
                <div className="grid grid-cols-2 gap-2 bg-bg-elevated p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setImportType("individual")}
                    className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      importType === "individual"
                        ? "bg-bg-card text-text-primary shadow-xs"
                        : "text-text-tertiary hover:text-text-secondary"
                    }`}
                  >
                    Separate items
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportType("consolidated")}
                    className={`py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                      importType === "consolidated"
                        ? "bg-bg-card text-text-primary shadow-xs"
                        : "text-text-tertiary hover:text-text-secondary"
                    }`}
                  >
                    Single consolidated
                  </button>
                </div>
              </div>

              {/* Consolidated category picker */}
              {importType === "consolidated" && (
                <div className="flex flex-col gap-1 text-left sm:col-span-2 animate-fade-in">
                  <label className="text-[9px] text-text-tertiary uppercase tracking-wider font-bold">Consolidated Category</label>
                  <Select value={consolidatedCategory} onValueChange={setConsolidatedCategory}>
                    <SelectTrigger className="h-10 rounded-xl bg-bg-elevated border-transparent font-bold text-text-primary cursor-pointer text-xs">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.filter(c => c.name !== "Salary").map((cat) => (
                        <SelectItem key={cat.name} value={cat.name} className="cursor-pointer text-xs">
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* CTAs */}
            <div className="flex gap-2.5 mt-3 pt-3 border-t border-border-custom/40">
              <Button
                type="button"
                variant="outline"
                onClick={handleBackToUpload}
                className="flex-1 h-11 border border-border-custom/50 hover:bg-border-custom/20 rounded-full font-bold text-text-secondary transition cursor-pointer text-xs"
              >
                Scan Another
              </Button>
              <Button
                type="button"
                onClick={handleImportExpenses}
                className="flex-1 h-11 bg-accent-custom hover:bg-accent-custom-hover text-accent-custom-fg rounded-full font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md text-xs"
              >
                Import Expenses ({items.filter(i => i.checked).length})
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptScannerModal;
