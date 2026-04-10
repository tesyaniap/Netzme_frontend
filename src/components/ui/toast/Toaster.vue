<script setup lang="ts">
import { isVNode } from "vue"
import { CheckCircle, XCircle, Info, Loader2 } from "lucide-vue-next"
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "."
import { useToast } from "./use-toast"

const { toasts } = useToast()
</script>

<template>
  <ToastProvider>
    <Toast v-for="toast in toasts" :key="toast.id" v-bind="toast">
      <div class="flex items-start gap-3">
        <Loader2 v-if="toast.duration === 0" class="h-5 w-5 text-muted-foreground mt-0.5 shrink-0 animate-spin" />
        <CheckCircle v-else-if="!toast.variant || toast.variant === 'default'" class="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
        <XCircle v-else-if="toast.variant === 'destructive'" class="h-5 w-5 text-red-400 mt-0.5 shrink-0" />
        <Info v-else class="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
        <div class="grid gap-1">
          <ToastTitle v-if="toast.title">{{ toast.title }}</ToastTitle>
          <template v-if="toast.description">
            <ToastDescription v-if="isVNode(toast.description)">
              <component :is="toast.description" />
            </ToastDescription>
            <ToastDescription v-else>{{ toast.description }}</ToastDescription>
          </template>
        </div>
      </div>
      <ToastClose />
      <component :is="toast.action" />
    </Toast>
    <ToastViewport />
  </ToastProvider>
</template>
