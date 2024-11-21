async function request() {
  return await fetch('http://localhost:3000/checkin', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authorization:
        'tma user=%7B%22id%22%3A999154212%2C%22first_name%22%3A%22Noah%22%2C%22last_name%22%3A%22Lu6%E2%9B%8F%EF%B8%8F%22%2C%22username%22%3A%22Web3NoahLu1%22%2C%22language_code%22%3A%22zh-hans%22%2C%22is_premium%22%3Atrue%2C%22allows_write_to_pm%22%3Atrue%7D&hash=6055cd8db7ed74b738399655e80a69b22d05614443bc8b8f51604bd3a934eec9&auth_date=1722676406&start_param=123&chat_type=sender&chat_instance=9066148687938752585',
    },
  });
}

async function concurrentAttacks(count = 20) {
  const promises = [];
  for (let i = 0; i < count; i++) {
    promises.push(request());
  }
  return await Promise.all<Response>(promises);
}

concurrentAttacks()
  .catch((e) => {
    console.error(e);
  })
  .then((res) => {
    (res as Response[]).map((r) => console.log(r.status));
  });
