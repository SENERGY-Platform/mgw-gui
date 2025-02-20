export interface CoreService {
  name: string;
  container: CoreServiceContainer;
  image: Image;
}

interface CoreServiceContainer {
  id: string;
  name: string;
  state: string;
}

interface Image {
  repository: string;
  tag: string;
}

export interface CoreServicesResponse {
  [serviceID: string]: CoreService
}
