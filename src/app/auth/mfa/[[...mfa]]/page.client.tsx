"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { SYSTEM_CONFIG } from "~/app";
import { twoFactor } from "~/lib/auth-client";

export function TwoFactorPageClient() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [trustDevice, setTrustDevice] = useState(true);
  const [isUsingBackupCode, setIsUsingBackupCode] = useState(false);

  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupError, setBackupError] = useState("");
  const [backupMessage, setBackupMessage] = useState("");
  const [backupLoading, setBackupLoading] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Mock verification - always succeeds
    try {
      // Use mock twoFactor.verify
      twoFactor.verify()
        .then(() => {
          router.push(SYSTEM_CONFIG.redirectAfterSignIn);
        })
        .catch((err: unknown) => {
          setError(
            `Invalid ${isUsingBackupCode ? "backup" : "verification"} code. Please try again.`,
          );
          console.error(err);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
      setLoading(false);
    }
  };

  // Mock fetch backup codes function
  const fetchBackupCodes = async () => {
    setBackupLoading(true);
    setBackupError("");
    try {
      // Generate mock backup codes
      const mockBackupCodes = [
        "BACKUP-1234-ABCD",
        "BACKUP-5678-EFGH",
        "BACKUP-9012-IJKL",
        "BACKUP-3456-MNOP",
        "BACKUP-7890-QRST"
      ];
      setBackupCodes(mockBackupCodes);
    } catch (error) {
      setBackupError(
        "Failed to retrieve backup codes. You may need to enable 2FA first."
      );
      // don't log error to user
    } finally {
      setBackupLoading(false);
    }
  };

  const generateNewCodes = async () => {
    setBackupLoading(true);
    setBackupError("");
    setBackupMessage("");
    try {
      // Generate new mock backup codes
      const mockBackupCodes = [
        "NEW-1234-ABCD",
        "NEW-5678-EFGH",
        "NEW-9012-IJKL",
        "NEW-3456-MNOP",
        "NEW-7890-QRST"
      ];
      setBackupCodes(mockBackupCodes);
      setBackupMessage("New backup codes have been generated");
    } catch (error) {
      setBackupError("Failed to generate new backup codes.");
    } finally {
      setBackupLoading(false);
    }
  };

  // fetch codes when switching to backup code mode
  const toggleVerificationMethod = () => {
    setIsUsingBackupCode(!isUsingBackupCode);
    setCode("");
    setError("");
    if (!isUsingBackupCode) {
      void fetchBackupCodes();
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-6 shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
          <p className="mt-2 text-gray-600">
            {isUsingBackupCode
              ? "Enter a backup code"
              : "Enter your authentication code"}
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleVerify}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium" htmlFor="code">
                {isUsingBackupCode ? "Backup Code" : "Verification Code"}
              </label>
              <input
                className={`
                  mt-1 block w-full rounded-md border border-gray-300 px-3 py-2
                  shadow-sm
                  focus:border-blue-500 focus:ring-blue-500 focus:outline-none
                `}
                disabled={backupLoading}
                id="code"
                maxLength={isUsingBackupCode ? undefined : 6}
                name="code"
                onChange={(e) => {
                  setCode(e.target.value);
                }}
                pattern={isUsingBackupCode ? undefined : "[0-9]{6}"}
                placeholder={
                  isUsingBackupCode ? "Enter backup code" : "6-digit code"
                }
                required
                type="text"
                value={code}
              />
              <p className="mt-1 text-sm text-gray-500">
                {isUsingBackupCode
                  ? "enter one of your backup codes"
                  : "enter the 6-digit code from your authenticator app"}
              </p>
            </div>

            {!isUsingBackupCode && (
              <div className="flex items-start">
                <div className="flex h-5 items-center">
                  <input
                    checked={trustDevice}
                    className={`
                      h-4 w-4 rounded border-gray-300 text-blue-600
                      focus:ring-blue-500
                    `}
                    id="trustDevice"
                    name="trustDevice"
                    onChange={(e) => {
                      setTrustDevice(e.target.checked);
                    }}
                    type="checkbox"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    className="font-medium text-gray-700"
                    htmlFor="trustDevice"
                  >
                    Trust this device
                  </label>
                  <p className="text-gray-500">
                    you won't need to enter a verification code on this device
                    for 30 days
                  </p>
                </div>
              </div>
            )}

            {/* backup codes UI */}
            {isUsingBackupCode && (
              <div className="mt-6">
                <h3 className="mb-2 text-lg font-medium">your backup codes</h3>
                {backupError && (
                  <div
                    className={`
                      mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700
                    `}
                  >
                    {backupError}
                  </div>
                )}
                {backupMessage && (
                  <div
                    className={`
                      mb-4 rounded-md bg-green-50 p-4 text-sm text-green-700
                    `}
                  >
                    {backupMessage}
                  </div>
                )}
                {backupLoading ? (
                  <div className="mb-4 text-center text-gray-500">
                    loading backup codes...
                  </div>
                ) : backupCodes.length > 0 ? (
                  <div
                    className={`
                      mb-6 grid grid-cols-2 gap-2
                      sm:grid-cols-3
                    `}
                  >
                    {backupCodes.map((code) => (
                      <div
                        className={`
                          rounded-md bg-gray-100 p-2 text-center font-mono
                        `}
                        key={code}
                      >
                        {code}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`
                      mb-6 rounded-md bg-yellow-50 p-4 text-sm text-yellow-700
                    `}
                  >
                    no backup codes available. generate new codes below.
                  </div>
                )}
                <div className="flex justify-center">
                  <button
                    className={`
                      flex items-center justify-center rounded-md bg-blue-600
                      px-4 py-2 text-sm font-medium text-white
                      hover:bg-blue-700
                      focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                      focus:outline-none
                      disabled:opacity-50
                    `}
                    disabled={backupLoading}
                    onClick={generateNewCodes}
                    type="button"
                  >
                    generate new backup codes
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col space-y-4">
            <button
              className={`
                flex w-full justify-center rounded-md bg-blue-600 px-4 py-2
                text-sm font-medium text-white
                hover:bg-blue-700
                focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                focus:outline-none
                disabled:opacity-50
              `}
              disabled={loading}
              type="submit"
            >
              {loading ? "Verifying..." : "Verify"}
            </button>

            <button
              className={`
                flex w-full justify-center rounded-md bg-gray-200 px-4 py-2
                text-sm font-medium text-gray-700
                hover:bg-gray-300
                focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
                focus:outline-none
              `}
              onClick={toggleVerificationMethod}
              type="button"
            >
              {isUsingBackupCode
                ? "Use authenticator app instead"
                : "Use a backup code instead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
