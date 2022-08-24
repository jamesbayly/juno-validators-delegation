import { Delegation, Delegator, Validator } from "../types";
import { CosmosMessage } from "@subql/types-cosmos";

async function getDelegator(id: string): Promise<Delegator> {
  let delegator = await Delegator.get(id.toLowerCase());
  if (!delegator) {
    delegator = Delegator.create({
      id: id.toLowerCase(),
      totalDelegation: BigInt(0),
    });
    await delegator.save();
  }
  return delegator;
}

async function getValidator(
  id: string,
  currentBlock: bigint
): Promise<Validator> {
  let validator = await Validator.get(id.toLowerCase());
  if (!validator) {
    validator = Validator.create({
      id: id.toLowerCase(),
      createdBlock: currentBlock,
      totalDelegation: BigInt(0),
    });
    await validator.save();
  }
  return validator;
}

async function getDelegation(
  validator: string,
  delegator: string
): Promise<Delegation> {
  let delegation = await Delegation.get(
    validator.toLowerCase() + "-" + delegator.toLowerCase()
  );
  if (!delegation) {
    delegation = Delegation.create({
      id: validator.toLowerCase() + "-" + delegator.toLowerCase(),
      delegatorId: delegator.toLowerCase(),
      validatorId: validator.toLowerCase(),
      amount: BigInt(0),
    });
    await delegation.save();
  }
  return delegation;
}

export async function handleCreateValidator(msg: CosmosMessage): Promise<void> {
  if (msg.tx.tx.code === 0) {
    // we only care about successful transactions
    logger.info(
      "new Validator at block: " + msg.block.block.header.height.toString()
    );

    const payloadData = msg.msg.decodedMsg as {
      delegatorAddress: string;
      validatorAddress: string;
      value: {
        demon: string;
        amount: string;
      };
      description: {
        moniker: string;
        identity: string;
        website: string;
        security_contact: string;
        details: string;
      };
    };

    const delegator = await getDelegator(payloadData.delegatorAddress);

    delegator.totalDelegation += BigInt(payloadData.value.amount);
    await delegator.save();

    const validator = Validator.create({
      id: payloadData.validatorAddress.toLowerCase(),
      createdBlock: BigInt(msg.block.block.header.height),
      delegatorId: payloadData.delegatorAddress.toLowerCase(),
      totalDelegation: BigInt(payloadData.value.amount),
      moniker: payloadData.description?.moniker,
      identity: payloadData.description?.identity,
      website: payloadData.description?.website,
      security_contact: payloadData.description?.security_contact,
      details: payloadData.description?.details,
    });

    await validator.save();
  }
}

export async function handleDelegate(msg: CosmosMessage): Promise<void> {
  if (msg.tx.tx.code === 0) {
    // we only care about successful transactions
    logger.info(
      "new delegate at block: " + msg.block.block.header.height.toString()
    );

    const payloadData = msg.msg.decodedMsg as {
      delegatorAddress: string;
      validatorAddress: string;
      amount: {
        demon: string;
        amount: string;
      };
    };

    const delegator = await getDelegator(payloadData.delegatorAddress);

    const validator = await getValidator(
      payloadData.validatorAddress,
      BigInt(msg.block.block.header.height)
    );

    const delegation = await getDelegation(
      payloadData.validatorAddress,
      payloadData.delegatorAddress
    );
    delegation.amount += BigInt(payloadData.amount.amount);

    await delegation.save();

    delegator.totalDelegation += BigInt(payloadData.amount.amount);
    await delegator.save();

    validator.totalDelegation += BigInt(payloadData.amount.amount);
    await validator.save();
  }
}

export async function handleUndelegate(msg: CosmosMessage): Promise<void> {
  if (msg.tx.tx.code === 0) {
    // we only care about successful transactions
    logger.info(
      "new undelegate at block: " + msg.block.block.header.height.toString()
    );

    const payloadData = msg.msg.decodedMsg as {
      delegatorAddress: string;
      validatorAddress: string;
      amount: {
        demon: string;
        amount: string;
      };
    };

    const delegator = await getDelegator(payloadData.delegatorAddress);

    const validator = await getValidator(
      payloadData.validatorAddress,
      BigInt(msg.block.block.header.height)
    );

    const delegation = await getDelegation(
      payloadData.validatorAddress,
      payloadData.delegatorAddress
    );
    delegation.amount -= BigInt(payloadData.amount.amount);

    await delegation.save();

    delegator.totalDelegation -= BigInt(payloadData.amount.amount);
    await delegator.save();

    validator.totalDelegation -= BigInt(payloadData.amount.amount);
    await validator.save();
  }
}

export async function handleRedelegate(msg: CosmosMessage): Promise<void> {
  if (msg.tx.tx.code === 0) {
    // we only care about successful transactions
    logger.info(
      "new redelegate at block: " + msg.block.block.header.height.toString()
    );

    const payloadData = msg.msg.decodedMsg as {
      delegatorAddress: string;
      validatorSrcAddress: string;
      validatorDstAddress: string;
      amount: {
        demon: string;
        amount: string;
      };
    };

    await getDelegator(payloadData.delegatorAddress);

    const validatorSrc = await getValidator(
      payloadData.validatorSrcAddress,
      BigInt(msg.block.block.header.height)
    );

    const validatorDst = await getValidator(
      payloadData.validatorDstAddress,
      BigInt(msg.block.block.header.height)
    );

    const delegationSrc = await getDelegation(
      payloadData.validatorSrcAddress,
      payloadData.delegatorAddress
    );
    const delegationDst = await getDelegation(
      payloadData.validatorDstAddress,
      payloadData.delegatorAddress
    );

    delegationSrc.amount -= BigInt(payloadData.amount.amount);
    delegationDst.amount += BigInt(payloadData.amount.amount);

    await delegationSrc.save();
    await delegationDst.save();

    validatorSrc.totalDelegation -= BigInt(payloadData.amount.amount);
    await validatorSrc.save();

    validatorDst.totalDelegation += BigInt(payloadData.amount.amount);
    await validatorDst.save();
  }
}
