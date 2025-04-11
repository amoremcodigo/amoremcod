"use client"

import { createContext, useContext, useState, type ReactNode, useCallback } from "react"

// Define the types for the form data
type FormData = {
  email: string
  coupleNames: string
  date: string
  time: string
  message: string
  youtubeLink: string
  photos: string[]
  photoUrls: string[]
  plan: "basic" | "premium" | null
}

// Define the shape of the context value
type FormContextValue = {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  addPhoto: (photo: string, index: number) => void
  removePhoto: (index: number) => void
  updatePhotos: (photos: string[]) => void
  isFormValid: () => boolean
  submitForm: () => Promise<void>
  isSubmitting: boolean
}

// Create the context
const FormContext = createContext<FormContextValue | undefined>(undefined)

// Create a provider component
export function FormProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    coupleNames: "",
    date: "",
    time: "",
    message: "",
    youtubeLink: "",
    photos: ["", "", "", "", ""],
    photoUrls: ["", "", "", "", ""],
    plan: null,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const addPhoto = (photo: string, index: number) => {
    setFormData((prev) => {
      const newPhotos = [...prev.photos]
      newPhotos[index] = photo
      return { ...prev, photos: newPhotos }
    })
  }

  const removePhoto = (index: number) => {
    setFormData((prev) => {
      const newPhotos = [...prev.photos]
      newPhotos[index] = ""
      return { ...prev, photos: newPhotos }
    })
  }

  const updatePhotos = (photos: string[]) => {
    setFormData((prev) => ({ ...prev, photos: photos }))
  }

  const isFormValid = useCallback(() => {
    return (
      formData.email !== "" &&
      formData.coupleNames !== "" &&
      formData.date !== "" &&
      formData.message !== "" &&
      formData.photos[0] !== "" &&
      formData.plan !== null
    )
  }, [formData])

  const submitForm = async () => {
    setIsSubmitting(true)
    try {
      // Simulate form submission
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Reset form data after submission
      setFormData({
        email: "",
        coupleNames: "",
        date: "",
        time: "",
        message: "",
        youtubeLink: "",
        photos: ["", "", "", "", ""],
        photoUrls: ["", "", "", "", ""],
        plan: null,
      })

      alert("Página criada com sucesso!")
    } finally {
      setIsSubmitting(false)
    }
  }

  const value: FormContextValue = {
    formData,
    updateFormData,
    addPhoto,
    removePhoto,
    updatePhotos,
    isFormValid,
    submitForm,
    isSubmitting,
  }

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>
}

// Create a hook to use the context
export function useFormContext() {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error("useFormContext must be used within a FormProvider")
  }
  return context
}
