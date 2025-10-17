'use client'
import { useState } from "react";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";

export default function UploadSpeedyteamPage() {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        details?: {
            totalRows: number;
            successful: number;
            failed: number;
            errors: string[];
        };
    } | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Check if file is xlsx
            if (selectedFile.name.endsWith('.xlsx') || selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                setFile(selectedFile);
                setResult(null);
            } else {
                alert('Please select an Excel file (.xlsx)');
                setFile(null);
            }
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setResult(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload-speedyteam', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            setResult(data);
        } catch (error) {
            setResult({
                success: false,
                message: 'Failed to upload file. Please try again.',
            });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col justify-center items-center w-full h-full">
            <div className="bg-white rounded-lg shadow-md p-6 mx-auto max-w-lg w-full">
                <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Upload className="w-6 h-6" />
                    Upload Speedyteam
                </h1>

                <div className="space-y-6">
                    {/* File Upload Area */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                        <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <div className="mb-4">
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <span className="text-lg font-medium text-gray-700">
                                    Choose Excel file (.xlsx)
                                </span>
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept=".xlsx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <p className="text-sm text-gray-500">
                            Upload an Excel file with the same structure as the screenshot
                        </p>
                        {file && (
                            <p className="text-sm text-blue-600 mt-2 font-medium">
                                Selected: {file.name}
                            </p>
                        )}
                    </div>

                    {/* Upload Button */}
                    <button
                        onClick={handleUpload}
                        disabled={!file || uploading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md font-semibold flex items-center justify-center gap-2"
                    >
                        {uploading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                Upload Runners
                            </>
                        )}
                    </button>

                    {/* Result Display */}
                    {result && (
                        <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                            <div className="flex items-start gap-2">
                                {result.success ? (
                                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                                ) : (
                                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <p className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                                        {result.message}
                                    </p>
                                    {result.details && (
                                        <div className="mt-2 text-sm">
                                            <p className="text-gray-600">
                                                Total rows: {result.details.totalRows} | 
                                                Successful: {result.details.successful} | 
                                                Failed: {result.details.failed}
                                            </p>
                                            {result.details.errors.length > 0 && (
                                                <div className="mt-2">
                                                    <p className="font-medium text-red-800">Errors:</p>
                                                    <ul className="list-disc list-inside text-red-700">
                                                        {result.details.errors.map((error, index) => (
                                                            <li key={index}>{error}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                        <h3 className="font-medium text-blue-800 mb-2">Expected Excel Structure:</h3>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• <strong>Voornaam</strong> (Column C) → firstName</li>
                            <li>• <strong>Achternaam</strong> (Column D) → lastName</li>
                            <li>• <strong>R-nummer</strong> (Column E) → identification</li>
                            <li>• <strong>GSM-nummer</strong> (Column F) → phoneNumber</li>
                            <li>• <strong>Tijd in min:sec</strong> (Column G) → testTime</li>
                            <li>• <strong>Schoenmaat</strong> (Column I) → shoeSize</li>
                        </ul>
                        <p className="text-sm text-blue-700 mt-2">
                            Note: Time format should be like "1:25:00 AM" (the "Nee" in Column H is ignored)
                        </p>
                        <p className="text-sm text-blue-700 mt-2">
                            Default values: facultyId = 1, groupNumber = 0, firstYear = false
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
