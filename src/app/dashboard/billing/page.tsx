"use client"

import React, { useCallback, useState, useEffect } from "react"
import { Flex, Button, Box, TextField } from '@radix-ui/themes'
import styles from './page.module.css'
import axios, { AxiosResponse } from 'axios'
import { getBalance } from "@/api/Payment"

const Billing = () => {

  const [credit, setCredit] = useState("");
  const [balance, setBalance] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([getBalance()])
        console.log(results)
      } catch (error) {
        console.error("Error in data fetching:", error)
      }
    }
    fetchData()
  }, [])

  const handleCredit = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCredit(e.target.value)
  }, [])

  const handleDeposit = async () => {
    try {
      const response = await axios.post('https://api.nowpayments.io/v1/invoice', {
        price_amount: credit,
        price_currency: "usd",
        order_id: "",
        order_description: "Deposit to AVAX Marketplace",
        ipn_callback_url: "https://nowpayments.io",
        success_url: "http://localhost:3000/dashboard/billing",
        cancel_url: "http://localhost:3000/dashboard/billing"
      }, {
        headers: {
          'x-api-key': 'MJJRTZY-ZT743MJ-JZJCF76-ZXN8PP4',
          'Content-Type': 'application/json'
        }
      });


      console.log(response.data);

      window.open(response.data?.invoice_url, '_blank');

      return response.data;

    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  return (
    <Flex className={styles.bg} direction="column">
      <Flex className={styles.header} p="4">
        <Flex justify="between">
          <Flex direction="column">
            <div className={styles.headerTitle}>Billing</div>
            <div className={styles.subTitle}>Your transactions and billing history</div>
          </Flex>
        </Flex>
      </Flex>
      <Flex m="4"
        p="8"
        gap="10px"
        justify="start"
        direction="column"
        align="start"
        className={styles.billingWrapper}
      >
        <Flex>Current Balance: </Flex>
        <Flex align="center" gap="4">
          <div>Add Amount:</div>
          <TextField.Root placeholder="" className={styles.credit} onChange={handleCredit} value={credit}>
            <TextField.Slot>
            </TextField.Slot>
          </TextField.Root>
        </Flex>
        <Button mt="2" className={styles.billingButton} onClick={handleDeposit}>
          Add Credit
        </Button>
      </Flex>
    </Flex >
  )
}

export default Billing
