import React, { useCallback, useState, useEffect } from 'react'
import { apiClient } from '../../../../api-client/client'
import { EbookSignUp200Response, EbookSignUpOperationRequest, EbookSignUpRequest } from '../../../../api-client'
import { useLocalStorageState } from '../use-local-storage-state'
import { EbookSignUp200ResponseEbook } from './../../../../api-client/models/EbookSignUp200ResponseEbook'

export interface EbookFormValue {
  name: string
  email: string
  ebookUrl: string
  policy: boolean
  isError: boolean
  isSending: boolean
  errorMsg: string
  ebookResponse: EbookSignUp200Response
}

export function useEbookForm(ebookName: string) {
  const [sendedEbooks, setSendedEbooks] = useLocalStorageState('sendedEbooks')
  const [value, setValue] = useState<EbookFormValue>({
    name: '',
    email: '',
    ebookUrl: '',
    policy: false,
    isError: false,
    isSending: false,
    errorMsg: '',
    ebookResponse: {
      ebook: {
        name: '',
        url: '',
      },
    },
  })

  useEffect(() => {
    if (Array.isArray(sendedEbooks)) {
      const currentEbook: EbookSignUp200ResponseEbook = sendedEbooks.filter(
        (el: EbookSignUp200ResponseEbook) => el.name == ebookName
      )[0]
      if (currentEbook) {
        setValue(state => ({
          ...state,
          ebookResponse: {
            ebook: currentEbook,
          },
        }))
      }
    }
  }, [])

  const isValidValue = () => {
    const { name, email, policy } = value

    if (!name.trim()) {
      setValue(state => ({
        ...state,
        errorMsg: 'Name is required',
      }))
      return false
    }
    if (!email.trim()) {
      setValue(state => ({
        ...state,
        errorMsg: 'Email is required',
      }))
      return false
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValue(state => ({
        ...state,
        errorMsg: 'Invalid email format',
      }))
      return false
    }
    if (!policy) {
      setValue(state => ({
        ...state,
        errorMsg: 'Please give your accept Privacy Policy',
      }))
      return false
    }
    return true
  }

  const handleSubmit = useCallback(
    event => {
      setValue(state => ({
        ...state,
        isSending: true,
      }))
      event.preventDefault()
      const ebookSignUpRequest: EbookSignUpRequest = {
        consent: value.policy,
        email: value.email,
        name: value.name,
      }
      const param: EbookSignUpOperationRequest = {
        ebookName: ebookName,
        ebookSignUpRequest: ebookSignUpRequest,
      }
      if (!isValidValue()) return
      apiClient
        .ebookSignUp(param)
        .then(res => {
          setValue(state => ({
            ...state,
            ebookResponse: res,
            isSubmitted: true,
            isSending: false,
          }))
          if (Array.isArray(sendedEbooks)) {
            const currentEbookIndex: number = sendedEbooks.indexOf(
              (el: EbookSignUp200ResponseEbook) => el.name == res.ebook.name
            )
            if (currentEbookIndex < 0) {
              setSendedEbooks([...sendedEbooks, res.ebook])
            }
          } else {
            setSendedEbooks([res.ebook])
          }
        })
        .catch(err => {
          console.error('Error submitting Bright Ebook Form', err)
          setValue(state => ({
            ...state,
            errorMsg: err.message,
            isError: true,
            isSending: false,
          }))
        })
    },
    [value.policy, value.email, value.name]
  )

  function setPolicy(policy: boolean) {
    setValue({
      ...value,
      policy,
    })
  }

  function setEmail(email: string) {
    setValue({
      ...value,
      email,
    })
  }

  function setName(name: string) {
    setValue({
      ...value,
      name,
    })
  }

  return {
    value,
    setPolicy,
    handleSubmit,
    setEmail,
    setName,
  }
}
