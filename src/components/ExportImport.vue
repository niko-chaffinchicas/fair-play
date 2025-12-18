<template>
  <Teleport to="body">
    <div v-if="mode === 'import'" class="dialog-overlay" @click="handleOverlayClick">
      <div class="dialog export-import-dialog" @click.stop>
        <div class="dialog-header">
          <h2 class="dialog-title">Import Data</h2>
          <button
            class="dialog-close"
            aria-label="Close"
            @click="handleClose"
          >
            ×
          </button>
        </div>
        <div class="dialog-body">
          <p>Select a JSON file to import your card data.</p>
          <input
            ref="fileInputRef"
            type="file"
            accept=".json"
            style="display: none"
            @change="handleFileSelect"
          />
          <button class="btn btn-primary" @click="triggerFileInput">
            Choose File
          </button>
          <p v-if="error" class="error-message">{{ error }}</p>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="handleClose">Cancel</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useExportImport } from "../composables/useExportImport.js";

interface Props {
  mode: "export" | "import";
  onClose?: () => void;
  onImportSuccess?: () => void;
  onImportError?: (error: string) => void;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
}>();

const exportImport = useExportImport();
const fileInputRef = ref<HTMLInputElement | null>(null);
const error = ref<string | null>(null);

function handleClose(): void {
  emit("close");
  props.onClose?.();
}

function handleOverlayClick(e: MouseEvent): void {
  if (e.target === e.currentTarget) {
    handleClose();
  }
}

async function triggerFileInput(): Promise<void> {
  fileInputRef.value?.click();
}

async function handleFileSelect(e: Event): Promise<void> {
  const target = e.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  error.value = null;
  try {
    await exportImport.importData(file);
    props.onImportSuccess?.();
    handleClose();
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to import data";
    error.value = errorMessage;
    props.onImportError?.(errorMessage);
  }
}

// Handle Escape key
function handleEscape(e: KeyboardEvent): void {
  if (e.key === "Escape") {
    handleClose();
  }
}

// Prevent body scroll when modal is open
onMounted(() => {
  if (props.mode === "import") {
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
  }
});

onUnmounted(() => {
  if (props.mode === "import") {
    document.body.style.overflow = "";
    document.removeEventListener("keydown", handleEscape);
  }
});

// Expose export function for parent component
defineExpose({
  exportData: async () => {
    try {
      await exportImport.exportData();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to export data";
      error.value = errorMessage;
      throw err;
    }
  },
  triggerImport: () => {
    triggerFileInput();
  },
});
</script>

