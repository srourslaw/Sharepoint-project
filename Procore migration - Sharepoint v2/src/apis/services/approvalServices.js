import axios from 'axios';

export const fetchApprovalTable = async (
  selectedStatus = null,
  siteName = '',
) => {
  let approvalData = [];
  const authToken = JSON.parse(localStorage.getItem('authToken'));
  const accessToken = authToken.accessToken;
  const idToken = authToken.idToken;
  const resData = await fetch(
    `${process.env.REACT_APP_DMS_API_URL}/v1/doc-check/stream-sp-docs/${siteName}?doc_type=ALL${selectedStatus ? `&status=${selectedStatus}` : ''}`,
    {
      // const resData = await fetch(`${process.env.REACT_APP_DMS_API}/v1/doc-check/stream-sp-docs/gemlife-dev-sub1?doc_type=ALL&status=2`, {
      headers: {
        Authorization: `Bearer ${idToken}`,
        'X-Access-Token': accessToken,
        Accept: 'application/json',
      },
    },
  );
  let responseData = '';
  const textStream = resData.body.pipeThrough(new TextDecoderStream());
  const reader = textStream.getReader();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    responseData += value;
    let lines = responseData.split('\n');
    responseData = lines.pop(); // keep the last incomplete line

    for (let line of lines) {
      if (line.trim()) {
        const jsonObject = JSON.parse(line);
        approvalData = [...approvalData, jsonObject];
      }
    }
  }

  return approvalData;
};

export const fetchApprovalDetails = async (url, accessToken) => {
  const response = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json;odata=verbose',
      Accept: 'application/json;odata=verbose',
    },
  });

  return response.data;
};
