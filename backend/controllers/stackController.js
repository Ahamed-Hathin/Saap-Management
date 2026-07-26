const Stack = require('../models/Stack');

const getStacks = async (req, res) => {
  try {
    const stacks = await Stack.find({}).sort({ createdAt: -1 });
    res.json(stacks);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching stacks', error: error.message });
  }
};

const createStack = async (req, res) => {
  try {
    const { modelNumber, sizeA, sizeB, sizeC, totalStack } = req.body;

    const stackExists = await Stack.findOne({ modelNumber });
    if (stackExists) {
      stackExists.sizeA += sizeA || 0;
      stackExists.sizeB += sizeB || 0;
      stackExists.sizeC += sizeC || 0;
      stackExists.totalStack += totalStack || 0;
      const updatedStack = await stackExists.save();
      return res.status(200).json(updatedStack);
    }

    const stack = new Stack({
      modelNumber,
      sizeA: sizeA || 0,
      sizeB: sizeB || 0,
      sizeC: sizeC || 0,
      totalStack: totalStack || 0,
    });

    const createdStack = await stack.save();
    res.status(201).json(createdStack);
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error creating stack' });
  }
};

const updateStack = async (req, res) => {
  try {
    const { modelNumber, sizeA, sizeB, sizeC, totalStack } = req.body;
    const stack = await Stack.findById(req.params.id);

    if (stack) {
      stack.modelNumber = modelNumber || stack.modelNumber;
      stack.sizeA = sizeA !== undefined ? sizeA : stack.sizeA;
      stack.sizeB = sizeB !== undefined ? sizeB : stack.sizeB;
      stack.sizeC = sizeC !== undefined ? sizeC : stack.sizeC;
      stack.totalStack = totalStack !== undefined ? totalStack : stack.totalStack;

      const updatedStack = await stack.save();
      res.json(updatedStack);
    } else {
      res.status(404).json({ message: 'Stack not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message || 'Error updating stack' });
  }
};

const deleteStack = async (req, res) => {
  try {
    const stack = await Stack.findById(req.params.id);

    if (stack) {
      await stack.deleteOne();
      res.json({ message: 'Stack removed' });
    } else {
      res.status(404).json({ message: 'Stack not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting stack' });
  }
};

const uploadStackImage = async (req, res) => {
  try {
    const stack = await Stack.findById(req.params.id);

    if (stack) {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      stack.image = req.file.path;
      const updatedStack = await stack.save();
      res.json(updatedStack);
    } else {
      res.status(404).json({ message: 'Stack not found' });
    }
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
};

module.exports = {
  getStacks,
  createStack,
  updateStack,
  deleteStack,
  uploadStackImage,
};
