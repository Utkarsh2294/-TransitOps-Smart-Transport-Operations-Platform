import { FileText, Trash2, Upload } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";

import { apiOrigin, type ApiErrorResponse } from "../../lib/api";
import { deleteVehicleDocument, getServiceStatus, getVehicleDocuments, uploadVehicleDocument } from "../../lib/vehicles";
import type { ServiceStatus, Vehicle, VehicleDocument } from "../../types/vehicle";
import { Button } from "../ui/Button";

const expiryState = (date: string | null) => {
  if (!date) return { label: "No expiry", className: "text-muted" };
  const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
  return days < 0 ? { label: "Expired", className: "text-danger" } : days <= 30 ? { label: `${days}d remaining`, className: "text-warning" } : { label: "Valid", className: "text-success" };
};

export const VehicleDocuments = ({ vehicle, onChanged }: { vehicle: Vehicle; onChanged: () => Promise<void> }) => {
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [service, setService] = useState<ServiceStatus | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<VehicleDocument["docType"]>("RC");
  const [expiryDate, setExpiryDate] = useState("");
  const [error, setError] = useState<ApiErrorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const load = async () => { setIsLoading(true); try { const [docs, status] = await Promise.all([getVehicleDocuments(vehicle.id), getServiceStatus(vehicle.id)]); setDocuments(docs.data); setService(status.data); } catch (requestError) { setError(requestError as ApiErrorResponse); } finally { setIsLoading(false); } };
  useEffect(() => { void load(); }, [vehicle.id]);
  const upload = async (event: FormEvent) => { event.preventDefault(); if (!file) { setError({ field: "file", message: "Choose a PDF, JPG, or PNG document" }); return; } try { await uploadVehicleDocument(vehicle.id, { file, docType, expiryDate }); setFile(null); setExpiryDate(""); await Promise.all([load(), onChanged()]); } catch (requestError) { setError(requestError as ApiErrorResponse); } };
  const remove = async (documentId: number) => { try { await deleteVehicleDocument(vehicle.id, documentId); await Promise.all([load(), onChanged()]); } catch (requestError) { setError(requestError as ApiErrorResponse); } };
  const serviceText = !service?.configured ? "Set a service interval to track service due" : service.isOverdue ? `Service overdue by ${Math.abs(service.dueInKm ?? 0).toLocaleString("en-IN")} km` : `${(service.dueInKm ?? 0).toLocaleString("en-IN")} km to next service`;
  return <section className="mt-5 rounded-[14px] border border-border bg-surface p-5 shadow-card">
    <div className="mb-4 flex items-start justify-between"><div><p className="text-sm font-medium text-primary">Compliance records</p><h3 className="mt-1 text-lg font-semibold">Documents & service</h3></div><span className={`text-sm font-semibold ${service?.isOverdue ? "text-danger" : service?.isDueSoon ? "text-warning" : "text-success"}`}>{serviceText}</span></div>
    <form className="grid gap-2 md:grid-cols-[1fr_120px_150px_auto]" onSubmit={upload}><input accept=".pdf,.jpg,.jpeg,.png" className="h-10 text-sm" onChange={(event) => setFile(event.target.files?.[0] ?? null)} type="file" /><select className="h-10 rounded-md border border-border bg-background px-2 text-sm" onChange={(event) => setDocType(event.target.value as VehicleDocument["docType"])} value={docType}>{["RC", "Insurance", "PUC", "Permit", "Other"].map((type) => <option key={type}>{type}</option>)}</select><input className="h-10 rounded-md border border-border bg-background px-2 text-sm" onChange={(event) => setExpiryDate(event.target.value)} type="date" value={expiryDate} /><Button type="submit"><Upload className="mr-2 h-4 w-4" />Upload</Button></form>
    {error ? <p className="mt-3 text-sm text-danger">{error.message}</p> : null}
    <div className="mt-4 space-y-2">{isLoading ? <div className="h-16 animate-pulse rounded-md bg-panel" /> : null}{!isLoading && documents.length === 0 ? <p className="rounded-md border border-dashed border-border px-4 py-6 text-center text-sm text-muted">No documents uploaded yet.</p> : null}{documents.map((document) => { const state = expiryState(document.expiryDate); return <div className="flex items-center justify-between gap-3 rounded-md border border-border bg-raised p-3" key={document.id}><a className="flex min-w-0 items-center gap-3" href={`${apiOrigin}${document.fileUrl}`} rel="noreferrer" target="_blank"><FileText className="h-4 w-4 shrink-0 text-primary" /><span className="min-w-0"><span className="block text-sm font-semibold">{document.docType}</span><span className="block truncate text-xs text-muted">{document.fileName}</span></span></a><div className="flex items-center gap-3"><span className={`text-xs font-semibold ${state.className}`}>{state.label}</span><Button aria-label={`Delete ${document.fileName}`} onClick={() => void remove(document.id)} size="icon" type="button" variant="ghost"><Trash2 className="h-4 w-4" /></Button></div></div>; })}</div>
  </section>;
};
