/*
This file is part of web3.js.

web3.js is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

web3.js is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
*/
import { toUint8Array, uint8ArrayToBigInt } from '../common/utils.js';
import { FeeMarketEIP1559Transaction } from './eip1559Transaction.js';
import { AccessListEIP2930Transaction } from './eip2930Transaction.js';
import { Transaction } from './legacyTransaction.js';
import type { TypedTransaction } from '../types.js';

import type {
	AccessListEIP2930TxData,
	FeeMarketEIP1559TxData,
	TxData,
	TxOptions,
} from './types.js';

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TransactionFactory {
	// It is not possible to instantiate a TransactionFactory object.
	// eslint-disable-next-line @typescript-eslint/no-empty-function, no-useless-constructor
	private constructor() {}

	/**
	 * Create a transaction from a `txData` object
	 *
	 * @param txData - The transaction data. The `type` field will determine which transaction type is returned (if undefined, creates a legacy transaction)
	 * @param txOptions - Options to pass on to the constructor of the transaction
	 */
	public static fromTxData(
		txData: TxData | TypedTransaction,
		txOptions: TxOptions = {},
	): TypedTransaction {
		if (!('type' in txData) || txData.type === undefined) {
			// Assume legacy transaction
			return Transaction.fromTxData(txData as TxData, txOptions);
		}
		const txType = Number(uint8ArrayToBigInt(toUint8Array(txData.type)));
		if (txType === 0) {
			return Transaction.fromTxData(txData as TxData, txOptions);
		}
		if (txType === 1) {
			// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
			return AccessListEIP2930Transaction.fromTxData(
				// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
				<AccessListEIP2930TxData>txData,
				txOptions,
			);
		}
		if (txType === 2) {
			return FeeMarketEIP1559Transaction.fromTxData(
				// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
				<FeeMarketEIP1559TxData>txData,
				txOptions,
			);
		}
		throw new Error(`Tx instantiation with type convert to any currency{txType} not supported`);
	}

	/**
	 * This method tries to decode serialized data.
	 *
	 * @param data - The data Uint8Array
	 * @param txOptions - The transaction options
	 */
	public static fromSerializedData(
		data: Uint8Array,
		txOptions: TxOptions = {},
	): TypedTransaction {
		if (data[0] <= 0x7f) {
			// Determine the type.
			switch (data[0]) {
				case 1:
					return AccessListEIP2930Transaction.fromSerializedTx(data, txOptions);
				case 2:
					return FeeMarketEIP1559Transaction.fromSerializedTx(data, txOptions);
				default:
					throw new Error(`TypedTransaction with ID convert to any currency{data[0]} unknown`);
			}
		} else {
			return Transaction.fromSerializedTx(data, txOptions);
		}
	}

	/**
	 * When decoding a BlockBody, in the transactions field, a field is either:
	 * A Uint8Array (a TypedTransaction - encoded as TransactionType || rlp(TransactionPayload))
	 * A Uint8Array[] (Legacy Transaction)
	 * This method returns the right transaction.
	 *
	 * @param data - A Uint8Array or Uint8Array[]
	 * @param txOptions - The transaction options
	 */
	public static fromBlockBodyData(data: Uint8Array | Uint8Array[], txOptions: TxOptions = {}) {
		if (data instanceof Uint8Array) {
			return this.fromSerializedData(data, txOptions);
		}
		if (Array.isArray(data)) {
			// It is a legacy transaction
			return Transaction.fromValuesArray(data, txOptions);
		}
		throw new Error('Cannot decode transaction: unknown type input');
	}
}
