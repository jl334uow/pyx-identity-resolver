import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { LinkRegistrationService } from './link-registration.service';
import { IRepositoryProvider } from 'src/repository/providers/provider.repository.interface';
import { IdentifierManagementService } from '../identifier-management/identifier-management.service';
import { ConfigModule } from '@nestjs/config';

describe('LinkRegistrationService', () => {
  let service: LinkRegistrationService;
  let repositoryProvider: IRepositoryProvider;

  beforeEach(async () => {
    // Creates a testing module for the LinkRegistrationService.
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [
        LinkRegistrationService,
        {
          provide: 'RepositoryProvider',
          useValue: {
            one: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            translate: jest.fn().mockImplementation((key) => key),
          },
        },
        {
          provide: IdentifierManagementService,
          useValue: {
            getIdentifier: jest.fn().mockResolvedValue({
              namespace: 'testNamespace',
              applicationIdentifiers: [
                {
                  ai: '01',
                  regex: '^.*$',
                  type: 'I',
                  qualifiers: ['10'],
                },
                {
                  ai: '10',
                  regex: '^.*$',
                  type: 'Q',
                },
              ],
            }),
          },
        },
      ],
    }).compile();

    // Get the LinkRegistrationService and the RepositoryProvider instance from the testing module.
    service = module.get<LinkRegistrationService>(LinkRegistrationService);
    repositoryProvider = module.get<IRepositoryProvider>('RepositoryProvider');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should save the registration and return success message', async () => {
      const payload = {
        namespace: 'testNamespace',
        identificationKeyType: '01',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '',
        active: true,
        responses: [],
      };

      jest
        .spyOn(service['configService'], 'get')
        .mockReturnValue('testResolverDomain');

      const result = await service.create(payload);

      expect(result).toEqual({
        message: 'successes.register_link_resolver_successfully',
      });
    });

    it("should throw an exception if the repositoryProvider's save method throws an error", async () => {
      const payload = {
        namespace: 'testNamespace',
        identificationKeyType: '01',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '10/12345678901234567890',
        active: true,
        responses: [],
      };

      jest
        .spyOn(service['configService'], 'get')
        .mockReturnValue('testResolverDomain');

      jest
        .spyOn(repositoryProvider, 'save')
        .mockRejectedValue(new Error('Test error'));

      await expect(service.create(payload)).rejects.toThrow();
    });

    it('should throw an exception if the resolverDomain configuration is missing', async () => {
      const payload = {
        namespace: 'testNamespace',
        identificationKeyType: '01',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '10/12345678901234567890',
        active: true,
        responses: [],
      };
      jest.spyOn(service['configService'], 'get').mockImplementation((key) => {
        if (key === 'LINK_TYPE_VOC_DOMAIN') {
          return 'testLinkTypeVocDomain';
        }
        return undefined;
      });

      await expect(service.create(payload)).rejects.toThrow(
        'Missing configuration for RESOLVER_DOMAIN',
      );
    });

    it('should throw an exception if the linkTypeVocDomain configuration is missing', async () => {
      const payload = {
        namespace: 'testNamespace',
        identificationKeyType: '01',
        identificationKey: 'testKey',
        itemDescription: 'testDescription',
        qualifierPath: '10/12345678901234567890',
        active: true,
        responses: [],
      };
      jest.spyOn(service['configService'], 'get').mockImplementation((key) => {
        if (key === 'RESOLVER_DOMAIN') {
          return 'testResolverDomain';
        }
        return undefined;
      });

      await expect(service.create(payload)).rejects.toThrow(
        'Missing configuration for LINK_TYPE_VOC_DOMAIN',
      );
    });
  });
});
