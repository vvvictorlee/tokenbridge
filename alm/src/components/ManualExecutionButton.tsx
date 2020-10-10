import React, { useState, useEffect } from 'react'
import styled from 'styled-components'
import { InjectedConnector } from '@web3-react/injected-connector'
import { useWeb3React } from '@web3-react/core'
import { useStateProvider } from '../state/StateProvider'
import { signatureToVRS, packSignatures } from '../utils/signatures'

const StyledButton = styled.button`
  color: var(--button-color);
  border-color: var(--font-color);
  margin-top: 10px;
  &:focus {
    outline: var(--button-color);
  }
`

export interface BackButtonParam {
  onBackToMain: () => void
}

interface ManualExecutionButtonParams {
  messageData: string
}

export const ManualExecutionButton = ({ messageData }: ManualExecutionButtonParams) => {
  const { home, foreign } = useStateProvider()
  const { library, activate, account, active, error, setError } = useWeb3React()
  const [manualExecution, setManualExecution] = useState(false)

  useEffect(
    () => {
      if (!manualExecution || active) return

      activate(new InjectedConnector({ supportedChainIds: [foreign.chainId] }))
    },
    [manualExecution, active, foreign.chainId, activate]
  )

  useEffect(
    () => {
      if (!manualExecution || !library || !foreign.bridgeContract) return

      const collectedSignatures = home.confirmations
        .map(confirmation => confirmation.signature!)
        .filter(signature => signature !== '')
      const signatures = packSignatures(collectedSignatures.map(signatureToVRS))
      const data = foreign.bridgeContract.methods.executeSignatures(messageData, signatures).encodeABI()
      setManualExecution(false)

      library.eth
        .sendTransaction({
          from: account,
          to: foreign.bridgeAddress,
          data
        })
        .catch(setError)
    },
    [
      manualExecution,
      library,
      account,
      foreign.bridgeAddress,
      foreign.bridgeContract,
      setError,
      messageData,
      home.confirmations
    ]
  )

  return (
    <div>
      <StyledButton className="button outline is-left" onClick={() => setManualExecution(true)}>
        Execute signatures
      </StyledButton>
      {error && <span>{error.message}</span>}
    </div>
  )
}