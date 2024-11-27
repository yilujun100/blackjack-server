import { Injectable } from '@nestjs/common';
import { Client, mapping } from 'cassandra-driver';

@Injectable()
export class CassandraService {
  client: Client;
  mapper: mapping.Mapper;
  private createClient() {
    this.client = new Client({
      contactPoints: [process.env.CASSANDRA_HOST],
      keyspace: process.env.CASSANDRA_KEYSPACE,
      localDataCenter: process.env.CASSANDRA_DATACENTER,
      credentials: {
        username: process.env.CASSANDRA_USERNAME,
        password: process.env.CASSANDRA_PASSWORD,
      },
    });
  }

  createMapper(mappingOptions: mapping.MappingOptions) {
    if (this.client == undefined) {
      this.createClient();
    }
    return new mapping.Mapper(this.client, mappingOptions);
  }
}
