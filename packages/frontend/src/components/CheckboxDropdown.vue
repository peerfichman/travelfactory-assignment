<template>
  <div class="relative" ref="root">
    <button
      type="button"
      @click="open = !open"
      class="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white flex items-center gap-2 min-w-[170px] focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <span class="flex-1 text-left text-gray-700 truncate">{{ label }}</span>
      <svg
        class="w-4 h-4 text-gray-400 shrink-0 transition-transform"
        :class="{ 'rotate-180': open }"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <div
      v-if="open"
      class="absolute z-20 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg min-w-full"
    >
      <label
        v-for="opt in options"
        :key="opt.value"
        class="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm select-none"
      >
        <input
          type="checkbox"
          :value="opt.value"
          :checked="modelValue.includes(opt.value)"
          @change="toggle(opt.value)"
          class="rounded border-gray-300 text-blue-600 cursor-pointer"
        />
        <span class="text-gray-700">{{ opt.label }}</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface Option {
  label: string;
  value: string;
}

const props = defineProps<{
  options: Option[];
  placeholder: string;
  modelValue: string[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const open = ref(false);
const root = ref<HTMLElement | null>(null);

const label = computed(() => {
  const allSelected = props.modelValue.length === props.options.length;
  if (allSelected || props.modelValue.length === 0) return props.placeholder;
  const names = props.options.filter((o) => props.modelValue.includes(o.value)).map((o) => o.label);
  if (names.length <= 2) return names.join(', ');
  return `${names.length} selected`;
});

function toggle(value: string) {
  const next = props.modelValue.includes(value)
    ? props.modelValue.filter((v) => v !== value)
    : [...props.modelValue, value];
  emit('update:modelValue', next);
}

function onClickOutside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) {
    open.value = false;
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside));
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside));
</script>
