/**
 * Test script to verify the [object Object] fix
 * This tests various scenarios that could cause [object Object] display
 */

// Safe string utilities (copied for testing)
const safeString = (value) => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  
  if (typeof value === 'object') {
    if (value.message) return String(value.message);
    if (value.error && typeof value.error === 'string') return value.error;
    if (value.content) return String(value.content);
    if (Array.isArray(value)) {
      return value.map(item => safeString(item)).join(', ');
    }
    if (value.text) return String(value.text);
    if (value.title) return String(value.title);
    if (value.name) return String(value.name);
    if (value.statusText) return value.statusText;
    if (value.status) return `Status: ${value.status}`;
    console.warn('Object could not be safely converted to string:', value);
    return '';
  }
  
  return String(value);
};

const safeErrorMessage = (error) => {
  if (!error) return 'An unknown error occurred';
  if (typeof error === 'string') return error;
  if (error.response?.data?.message) {
    return safeString(error.response.data.message);
  }
  if (error.message) {
    return safeString(error.message);
  }
  if (error.response?.statusText) {
    return `${error.response.status}: ${error.response.statusText}`;
  }
  if (error.code === 'NETWORK_ERROR') {
    return 'Network connection failed';
  }
  return safeString(error) || 'An error occurred';
};

const safeContent = (content) => {
  const safe = safeString(content);
  if (!safe || !safe.trim()) {
    return '';
  }
  return safe;
};

console.log('🔍 Testing [object Object] fix...\n');

// Test cases that could cause [object Object] display
const testCases = [
  {
    name: 'Normal string',
    input: 'This is a normal comment',
    expected: 'This is a normal comment'
  },
  {
    name: 'Error object with message',
    input: { message: 'Authentication failed' },
    expected: 'Authentication failed'
  },
  {
    name: 'Nested error object',
    input: { error: 'Database connection failed' },
    expected: 'Database connection failed'
  },
  {
    name: 'Content object',
    input: { content: 'This is forum post content' },
    expected: 'This is forum post content'
  },
  {
    name: 'Plain object (should be empty)',
    input: { someKey: 'someValue' },
    expected: ''
  },
  {
    name: 'Null value',
    input: null,
    expected: ''
  },
  {
    name: 'Undefined value',
    input: undefined,
    expected: ''
  },
  {
    name: 'Number',
    input: 42,
    expected: '42'
  },
  {
    name: 'Array',
    input: ['item1', 'item2'],
    expected: 'item1, item2'
  },
  {
    name: 'HTTP Error Response',
    input: {
      response: {
        data: { message: 'Thread is locked' },
        status: 403
      }
    },
    expected: 'Thread is locked'
  }
];

// Test safeString function
console.log('Testing safeString function:');
testCases.forEach((testCase, index) => {
  const result = safeString(testCase.input);
  const passed = result === testCase.expected;
  console.log(`${index + 1}. ${testCase.name}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  if (!passed) {
    console.log(`   Expected: "${testCase.expected}"`);
    console.log(`   Got: "${result}"`);
  }
});

// Test safeErrorMessage function
console.log('\nTesting safeErrorMessage function:');
const errorTestCases = [
  {
    name: 'Standard Error',
    input: new Error('Something went wrong'),
    expected: 'Something went wrong'
  },
  {
    name: 'Axios Error',
    input: {
      response: {
        data: { message: 'Validation failed' },
        status: 400,
        statusText: 'Bad Request'
      }
    },
    expected: 'Validation failed'
  },
  {
    name: 'Network Error',
    input: {
      code: 'NETWORK_ERROR',
      message: 'Network Error'
    },
    expected: 'Network connection failed'
  },
  {
    name: 'String Error',
    input: 'Simple error message',
    expected: 'Simple error message'
  }
];

errorTestCases.forEach((testCase, index) => {
  const result = safeErrorMessage(testCase.input);
  const passed = result === testCase.expected;
  console.log(`${index + 1}. ${testCase.name}: ${passed ? '✅ PASS' : '❌ FAIL'}`);
  if (!passed) {
    console.log(`   Expected: "${testCase.expected}"`);
    console.log(`   Got: "${result}"`);
  }
});

console.log('\n🎉 Test completed! All functions should now prevent [object Object] display.');

// Simulate what would happen in a React component
console.log('\n📱 React Component Simulation:');
const mockForumPost = {
  id: 1,
  content: { message: 'This could cause [object Object]' }, // Problematic content
  author: 'user123'
};

console.log('Before fix (would show): [object Object]');
console.log('After fix (shows):', safeContent(mockForumPost.content));

const mockError = {
  response: {
    data: { message: 'Failed to post reply' }
  }
};

console.log('Error handling before fix: [object Object]');
console.log('Error handling after fix:', safeErrorMessage(mockError));

// Export for CommonJS
module.exports = { safeString, safeErrorMessage, safeContent };