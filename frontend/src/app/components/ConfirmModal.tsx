"use client";

interface ConfirmModalProps {
	open: boolean;
	title: string;
	message: string;
	onCancel: () => void;
	onConfirm: () => void;
	confirmLabel?: string;
	cancelLabel?: string;
	danger?: boolean;
}

export function ConfirmModal({
	open,
	title,
	message,
	onCancel,
	onConfirm,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	danger = false
}: ConfirmModalProps) {
	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
			<div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl">
				<h3 className="text-lg font-bold mb-2">{title}</h3>
				<p className="text-sm text-muted-foreground mb-6">{message}</p>
				<div className="flex justify-end gap-2">
					<button
						onClick={onCancel}
						className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-primary/5"
					>
						{cancelLabel}
					</button>
					<button
						onClick={onConfirm}
						className={`rounded-lg px-4 py-2 text-sm font-semibold text-white ${danger ? "bg-red-600 hover:bg-red-700" : "bg-primary hover:bg-primary/90"}`}
					>
						{confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
