/**
 * Token Launch Page
 * 
 * Mirrors the Bags.fm token launch flow:
 * - Token metadata form (name, symbol, description, image)
 * - Initial buy amount (SOL)
 * - Fee sharing toggle
 * - Review and sign transaction
 * 
 * Flow:
 * 1. User fills form and uploads image
 * 2. Backend uploads metadata to Bags API → returns tokenMint
 * 3. Backend creates launch transaction → returns serialized tx
 * 4. User reviews and signs with wallet
 * 5. Transaction sent to Solana RPC
 * 
 * TODO: AI Feature Hooks (marked with TODO comments):
 * - Auto-generate token name/symbol from concept
 * - Auto-generate description
 * - Suggest optimal initial buy amount
 * - Recommend fee sharing splits
 * - Risk assessment of token parameters
 */

"use client";
import bs58 from "bs58";
import { Header } from "../components";
import { useState, useCallback, useRef } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction, Transaction } from "@solana/web3.js";
import { FaUpload, FaSpinner, FaCheckCircle, FaRocket, FaImage, FaCoins } from "react-icons/fa";
import { FaWandMagicSparkles } from "react-icons/fa6";
import { ConnectWalletButton } from "../components/ConnectWalletButton";
import { ReviewModal } from "../components/ReviewModal";

// ... (interfaces etc remain same, skipping to keep context small if possible, but I need to be careful with replace)
// Actually, I can't check imports with replace_file_content easily without context.
// I will use two chunks. One for import, one for function.

// Chunk 1: Imports
// Chunk 2: signAndSendTransaction logic
// Wait, replace_file_content checks for SINGLE CONTIGUOUS block. I cannot do two chunks in one call.
// I will use multi_replace_file_content tool.

interface LaunchFormData {
  name: string;
  symbol: string;
  description: string;
  image: File | null;
  initialBuyAmount: string;
  telegram: string;
  twitter: string;
  website: string;
}

interface LaunchState {
  step: "form" | "uploading" | "creating" | "review" | "signing" | "success" | "error";
  error: string | null;
  tokenMint: string | null;
  metadataUrl: string | null;
  configKey: string | null;
  imageUrl: string | null;
  serializedTransaction: string | null;
  signature: string | null;
}

interface AIGenerationState {
  isGeneratingText: boolean;
  isGeneratingImage: boolean;
  idea: string;
  error: string | null;
  generatedMetadata: AIGeneratedMetadata | null;
}

interface AIGeneratedMetadata {
  name: string;
  symbol: string;
  description: string;
  logo_prompt: string;
  confidence: "low" | "medium" | "high";
}

const INITIAL_STATE: LaunchState = {
  step: "form",
  error: null,
  tokenMint: null,
  metadataUrl: null,
  configKey: null,
  imageUrl: null,
  serializedTransaction: null,
  signature: null,
};

export default function LaunchPage() {
  const { connected, publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<LaunchFormData>({
    name: "",
    symbol: "",
    description: "",
    image: null,
    initialBuyAmount: "",
    telegram: "",
    twitter: "",
    website: "",
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [state, setState] = useState<LaunchState>(INITIAL_STATE);

  // AI Generation state
  const [aiState, setAiState] = useState<AIGenerationState>({
    isGeneratingText: false,
    isGeneratingImage: false,
    idea: "",
    error: null,
    generatedMetadata: null,
  });

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setState((s) => ({ ...s, error: "Please select an image file" }));
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setState((s) => ({ ...s, error: "Image must be less than 5MB" }));
        return;
      }
      setFormData((f) => ({ ...f, image: file }));
      setImagePreview(URL.createObjectURL(file));
      setState((s) => ({ ...s, error: null }));
    }
  };

  // Generate metadata (text only) using AI
  const generateMetadataWithAI = async () => {
    if (!aiState.idea.trim()) {
      setAiState((s) => ({ ...s, error: "Please enter your token idea" }));
      return;
    }

    setAiState((s) => ({ ...s, isGeneratingText: true, error: null }));

    try {
      const response = await fetch("/api/launch/generate-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: aiState.idea }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate metadata");
      }

      // Auto-fill form fields with AI-generated data
      setFormData((f) => ({
        ...f,
        name: data.metadata.name,
        symbol: data.metadata.symbol,
        description: data.metadata.description,
      }));

      // Store generated metadata (including logo_prompt for later image generation)
      setAiState((s) => ({
        ...s,
        isGeneratingText: false,
        generatedMetadata: data.metadata,
      }));
    } catch (error) {
      setAiState((s) => ({
        ...s,
        isGeneratingText: false,
        error: error instanceof Error ? error.message : "Failed to generate metadata",
      }));
    }
  };

  // Generate logo image using AI
  const generateLogoWithAI = async () => {
    if (!aiState.generatedMetadata?.logo_prompt) {
      setAiState((s) => ({ ...s, error: "No logo prompt available. Generate text first." }));
      return;
    }

    setAiState((s) => ({ ...s, isGeneratingImage: true, error: null }));

    try {
      const response = await fetch("/api/launch/generate-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoPrompt: aiState.generatedMetadata.logo_prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate logo");
      }

      // Set AI-generated logo
      setImagePreview(data.logo);
      // Convert base64 to File for form submission
      const base64Response = await fetch(data.logo);
      const blob = await base64Response.blob();
      const file = new File([blob], "ai-generated-logo.png", { type: "image/png" });
      setFormData((f) => ({ ...f, image: file }));

      setAiState((s) => ({ ...s, isGeneratingImage: false }));
    } catch (error) {
      setAiState((s) => ({
        ...s,
        isGeneratingImage: false,
        error: error instanceof Error ? error.message : "Failed to generate logo",
      }));
    }
  };

  // Helper to upload image to IPFS (e.g., Pinata)
  // TODO: Implement this with your IPFS provider credentials
  const uploadToIpfs = async (file: File): Promise<string | null> => {
    // Example Pinata implementation:
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_PINATA_JWT}`,
      },
      body: formData,
    });

    const data = await res.json();
    console.log("Pinata upload response:", data);

    if (!data.IpfsHash) {
      console.error("Failed to get IpfsHash from Pinata response");
      return null;
    }

    return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;


    // Return null to fall back to Bags API file upload
    return null;
  };

  // Upload metadata to backend
  const uploadMetadata = async (): Promise<{ tokenMint: string; metadataUrl: string; imageUrl: string; configKey: string }> => {
    if (!formData.image) throw new Error("Image is required");

    // Try to upload image to IPFS first
    // If successful, we pass the URL. If not (returns null), we pass the file.
    const ipfsImageUrl = await uploadToIpfs(formData.image);

    const uploadFormData = new FormData();
    uploadFormData.append("name", formData.name);
    uploadFormData.append("symbol", formData.symbol);
    uploadFormData.append("description", formData.description);

    if (ipfsImageUrl) {
      uploadFormData.append("imageUrl", ipfsImageUrl);
    } else {
      uploadFormData.append("image", formData.image);
    }

    if (formData.telegram) uploadFormData.append("telegram", formData.telegram);
    if (formData.twitter) uploadFormData.append("twitter", formData.twitter);
    if (formData.website) uploadFormData.append("website", formData.website);

    const response = await fetch("/api/launch/create-token-info", {
      method: "POST",
      body: uploadFormData,
    });

    const data = await response.json();
    console.log("Result from create-token-info:", data);

    if (!response.ok) {
      throw new Error(data.error || "Failed to upload metadata");
    }

    // Handle tokenMetadata: it can be a string (URL) or object { uri, image }
    const metadataUrl = typeof data.tokenMetadata === 'string'
      ? data.tokenMetadata
      : data.tokenMetadata?.uri;

    const imageUrl = typeof data.tokenMetadata === 'string'
      ? data.tokenLaunch?.image // Use the image from tokenLaunch if metadata is just a URL string
      : data.tokenMetadata?.image;

    return {
      tokenMint: data.tokenMint,
      metadataUrl,
      imageUrl,
      configKey: data.tokenLaunch?.config,
    };
  };

  // Create launch transaction
  const createLaunchTransaction = async (tokenMint: string, metadataUrl: string, configKey: string): Promise<string> => {
    if (!publicKey) throw new Error("Wallet not connected");

    const response = await fetch("/api/launch/create-launch-transaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokenMint,
        wallet: publicKey.toString(),
        ipfs: metadataUrl,
        configKey: configKey,
        initialBuyAmount: formData.initialBuyAmount || undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create launch transaction");
    }

    return data.transaction;
  };

  // Sign and send transaction
  const signAndSendTransaction = async (serializedTx: string): Promise<string> => {
    if (!signTransaction || !publicKey || !connection) {
      throw new Error("Wallet not ready");
    }

    // Deserialize transaction
    // Strictly use base58 for Solana transactions
    const txBuffer = bs58.decode(serializedTx);

    let transaction: VersionedTransaction | Transaction;

    try {
      // Try versioned transaction first
      transaction = VersionedTransaction.deserialize(txBuffer);
    } catch {
      // Fall back to legacy transaction
      transaction = Transaction.from(txBuffer);
    }

    // Sign transaction
    const signed = await signTransaction(transaction);

    // Send transaction
    const signature = await connection.sendRawTransaction(signed.serialize(), {
      skipPreflight: false,
      preflightCommitment: "confirmed",
      maxRetries: 3,
    });

    // Wait for confirmation
    const confirmation = await connection.confirmTransaction(signature, "confirmed");

    if (confirmation.value.err) {
      throw new Error(`Transaction failed: ${confirmation.value.err}`);
    }

    return signature;
  };

  // Create fee share config
  const createFeeShareConfig = async (tokenMint: string, wallet: string): Promise<string> => {
    // Default to 100% fees to the creator
    const response = await fetch("/api/launch/create-fee-share-config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payer: wallet,
        baseMint: tokenMint,
        claimersArray: [wallet],
        basisPointsArray: [10000],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to create fee share config");
    }

    // Check if there are transactions to sign
    if (data.transactions && data.transactions.length > 0) {
      console.log(`Signing ${data.transactions.length} fee config creation transactions...`);

      for (const tx of data.transactions) {
        try {
          // The API returns { transaction: "base64...", blockhash: ... } 
          // We just need the transaction string usually, but let's check structure from docs/logs if possible.
          // Based on previous logs/docs, it's an array of objects which might have 'transaction' field.
          // Let's assume tx is the object or string.
          // Docs said: "transactions": [ { "blockhash": ..., "transaction": "..." } ]

          const txString = tx.transaction || tx; // Handle both object and string cases safely

          console.log("Signing config tx...");
          const signature = await signAndSendTransaction(txString);
          console.log("Config tx confirmed:", signature);
        } catch (err) {
          console.error("Failed to sign/send config creation tx:", err);
          throw new Error("Failed to initialize fee share config. Please try again.");
        }
      }
    }

    return data.config;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !publicKey) {
      setState((s) => ({ ...s, error: "Please connect your wallet first" }));
      return;
    }

    // Validate form
    if (!formData.name || !formData.symbol || !formData.description || !formData.image) {
      setState((s) => ({ ...s, error: "Please fill in all required fields" }));
      return;
    }

    setState((s) => ({ ...s, step: "uploading", error: null }));

    try {
      // Step 1: Upload metadata
      const { tokenMint, metadataUrl, imageUrl, configKey: returnedConfigKey } = await uploadMetadata();

      let configKey = returnedConfigKey;

      // Step 1.5: Get config key if not returned
      if (!configKey) {
        console.log("Config key missing from metadata upload, fetching new one...");
        try {
          configKey = await createFeeShareConfig(tokenMint, publicKey.toString());
        } catch (e) {
          console.warn("Could not create config key, trying to proceed without it:", e);
        }
      }

      if (!configKey) {
        throw new Error("Unable to create fee share configuration. Please try again.");
      }

      console.log("Using Config Key:", configKey);

      setState((s) => ({
        ...s,
        tokenMint,
        metadataUrl,
        imageUrl,
        configKey: configKey,
        step: "creating",
      }));

      // Wait for RPC propagation of the new config account
      console.log("Waiting for config propagation...");
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Step 2: Create launch transaction
      const serializedTransaction = await createLaunchTransaction(tokenMint, metadataUrl, configKey);

      if (!serializedTransaction) {
        throw new Error("Failed to create launch transaction");
      }

      setState((s) => ({
        ...s,
        serializedTransaction,
        step: "review",
      }));
    } catch (error) {
      console.error("Launch error:", error);
      setState((s) => ({
        ...s,
        step: "error",
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }));
    }
  };

  // Handle transaction confirmation
  const handleConfirmTransaction = async () => {
    if (!state.serializedTransaction) {
      console.error("No serialized transaction to sign");
      return;
    }

    console.log(`Starting confirmation for tx: ${state.serializedTransaction.substring(0, 20)}... (len: ${state.serializedTransaction.length})`);

    setState((s) => ({ ...s, step: "signing" }));

    try {
      const signature = await signAndSendTransaction(state.serializedTransaction);
      console.log("Launch transaction confirmed:", signature);
      setState((s) => ({
        ...s,
        signature,
        step: "success",
      }));
    } catch (error) {
      console.error("Transaction confirmation failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Transaction failed";

      setState((s) => ({
        ...s,
        step: "review",
        error: errorMessage,
      }));

      // Re-throw so ReviewModal can display the error
      throw error;
    }
  };

  // Reset form
  const handleReset = () => {
    setFormData({
      name: "",
      symbol: "",
      description: "",
      image: null,
      initialBuyAmount: "",
      telegram: "",
      twitter: "",
      website: "",
    });
    setImagePreview(null);
    setState(INITIAL_STATE);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-black mt-10">
      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Launch Your Token</h1>
          <p className="text-[#9aa0a6]">Create a new token on Solana via Bags protocol</p>
        </div>

        {/* Success State */}
        {state.step === "success" && (
          <div className="bg-[#0c0f14] border border-[#141922] rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-[#00ff7f]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaCheckCircle className="text-3xl text-[#00ff7f]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Token Launched!</h2>
            <p className="text-[#9aa0a6] mb-6">
              Your token has been successfully created on Solana.
            </p>
            {state.signature && (
              <div className="bg-[#07090c] rounded-lg p-4 mb-6">
                <p className="text-sm text-[#9aa0a6] mb-1">Transaction Signature</p>
                <a
                  href={`https://solscan.io/tx/${state.signature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00ff7f] font-mono text-sm break-all hover:underline"
                >
                  {state.signature}
                </a>
              </div>
            )}
            {state.tokenMint && (
              <div className="bg-[#07090c] rounded-lg p-4 mb-6">
                <p className="text-sm text-[#9aa0a6] mb-1">Token Mint</p>
                <a
                  href={`https://solscan.io/token/${state.tokenMint}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#00ff7f] font-mono text-sm break-all hover:underline"
                >
                  {state.tokenMint}
                </a>
              </div>
            )}
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-[#00ff7f] text-black font-semibold rounded-lg hover:bg-[#00e676] transition-colors"
            >
              Launch Another Token
            </button>
          </div>
        )}

        {/* Form */}
        {state.step !== "success" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Banner */}
            {state.error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-red-400 text-sm">{state.error}</p>
              </div>
            )}

            {/* AI Generation Section */}
            <div className="p-6 bg-[#0c0f14] border border-[#141922] rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-[#00ff7f]/10 rounded-lg flex items-center justify-center">
                  <FaWandMagicSparkles className="text-[#00ff7f]" />
                </div>
                <h3 className="text-lg font-semibold text-white">Generate with AI</h3>
              </div>
              <p className="text-sm text-[#9aa0a6] mb-4">
                Describe your token concept and let AI generate the name, symbol, description, and logo.
              </p>

              {aiState.error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                  <p className="text-red-400 text-sm">{aiState.error}</p>
                </div>
              )}

              <div className="flex gap-3">
                <input
                  type="text"
                  value={aiState.idea}
                  onChange={(e) => setAiState((s) => ({ ...s, idea: e.target.value }))}
                  placeholder="e.g., A token for cat lovers who want to save stray cats"
                  maxLength={500}
                  disabled={aiState.isGeneratingText}
                  className="flex-1 px-4 py-3 bg-[#07090c] border border-[#141922] rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:border-[#00ff7f]/50 transition-colors disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={generateMetadataWithAI}
                  disabled={aiState.isGeneratingText || !aiState.idea.trim()}
                  className="px-6 py-3 bg-[#00ff7f] text-black font-semibold rounded-lg hover:bg-[#00e676] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  {aiState.isGeneratingText ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FaWandMagicSparkles />
                      Generate
                    </>
                  )}
                </button>
              </div>

              {/* Show generated metadata info and logo generation button */}
              {aiState.generatedMetadata && (
                <div className="mt-4 p-4 bg-[#07090c] rounded-lg border border-[#141922]">
                  <button
                    type="button"
                    onClick={generateLogoWithAI}
                    disabled={aiState.isGeneratingImage}
                    className="w-full py-3 bg-[#141922] text-white font-medium rounded-lg hover:bg-[#1a1f2a] border border-[#00ff7f]/30 hover:border-[#00ff7f]/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {aiState.isGeneratingImage ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        Generating Logo...
                      </>
                    ) : (
                      <>
                        <FaWandMagicSparkles className="text-[#00ff7f]" />
                        Generate Logo with AI
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Token Image <span className="text-red-400">*</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative aspect-square max-w-[200px] mx-auto border-2 border-dashed border-[#141922] rounded-xl overflow-hidden cursor-pointer hover:border-[#00ff7f]/50 transition-colors"
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-[#9aa0a6]">
                    <FaImage className="text-3xl mb-2" />
                    <span className="text-sm">Click to upload</span>
                    <span className="text-xs mt-1">PNG, JPG, GIF (max 5MB)</span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Token Name */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Token Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g., My Awesome Token"
                maxLength={32}
                className="w-full px-4 py-3 bg-[#07090c] border border-[#141922] rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:border-[#00ff7f]/50 transition-colors"
              />
              {/* TODO: AI Feature Hook - Auto-generate name suggestions based on concept input */}
            </div>

            {/* Token Symbol */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Symbol <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.symbol}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, symbol: e.target.value.toUpperCase() }))
                }
                placeholder="e.g., MAT"
                maxLength={10}
                className="w-full px-4 py-3 bg-[#07090c] border border-[#141922] rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:border-[#00ff7f]/50 transition-colors"
              />
              {/* TODO: AI Feature Hook - Suggest symbol based on token name */}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Description <span className="text-red-400">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                placeholder="Describe your token..."
                rows={4}
                maxLength={1000}
                className="w-full px-4 py-3 bg-[#07090c] border border-[#141922] rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:border-[#00ff7f]/50 transition-colors resize-none"
              />
              {/* TODO: AI Feature Hook - Auto-generate description from concept */}
            </div>

            {/* Initial Buy Amount */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Initial Buy Amount (SOL)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.initialBuyAmount}
                  onChange={(e) => setFormData((f) => ({ ...f, initialBuyAmount: e.target.value }))}
                  placeholder="0.0"
                  min="0"
                  max="10"
                  step="0.001"
                  className="w-full px-4 py-3 bg-[#07090c] border border-[#141922] rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:border-[#00ff7f]/50 transition-colors"
                />
                <FaCoins className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7280]" />
              </div>
              <p className="text-xs text-[#6b7280] mt-1">
                Optional: Buy tokens immediately after launch (max 10 SOL)
              </p>
              {/* TODO: AI Feature Hook - Suggest optimal initial buy amount based on market conditions */}
            </div>

            {/* Social Links (Optional) */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-[#9aa0a6] uppercase tracking-wide">
                Social Links (Optional)
              </h3>
              <input
                type="text"
                value={formData.twitter}
                onChange={(e) => setFormData((f) => ({ ...f, twitter: e.target.value }))}
                placeholder="Twitter/X URL"
                className="w-full px-4 py-3 bg-[#07090c] border border-[#141922] rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:border-[#00ff7f]/50 transition-colors"
              />
              <input
                type="text"
                value={formData.telegram}
                onChange={(e) => setFormData((f) => ({ ...f, telegram: e.target.value }))}
                placeholder="Telegram URL"
                className="w-full px-4 py-3 bg-[#07090c] border border-[#141922] rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:border-[#00ff7f]/50 transition-colors"
              />
              <input
                type="text"
                value={formData.website}
                onChange={(e) => setFormData((f) => ({ ...f, website: e.target.value }))}
                placeholder="Website URL"
                className="w-full px-4 py-3 bg-[#07090c] border border-[#141922] rounded-lg text-white placeholder-[#6b7280] focus:outline-none focus:border-[#00ff7f]/50 transition-colors"
              />
              {/* TODO: AI Feature Hook - Auto-extract social links from project description */}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!connected || state.step === "uploading" || state.step === "creating"}
              className="w-full py-4 bg-[#00ff7f] text-black font-semibold rounded-lg hover:bg-[#00e676] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {state.step === "uploading" ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Uploading Metadata...
                </>
              ) : state.step === "creating" ? (
                <>
                  <FaSpinner className="animate-spin" />
                  Creating Transaction...
                </>
              ) : (
                <>
                  <FaRocket />
                  Create Coin
                </>
              )}
            </button>

            {!connected && (
              <p className="text-center text-sm text-[#9aa0a6]">
                Connect your wallet to launch a token
              </p>
            )}
          </form>
        )}
      </main>

      {/* Review Modal */}
      <ReviewModal
        isOpen={state.step === "review" || state.step === "signing"}
        onClose={() => setState((s) => ({ ...s, step: "form" }))}
        onConfirm={handleConfirmTransaction}
        tokenInfo={{
          name: formData.name,
          symbol: formData.symbol,
          description: formData.description,
          imageUrl: imagePreview || undefined,
        }}
        transactionDetails={{
          tokenMint: state.tokenMint || "",
          creator: publicKey?.toString() || "",
          initialBuyAmount: formData.initialBuyAmount,
        }}
        serializedTransaction={state.serializedTransaction || ""}
      />
    </div>
  );
}
