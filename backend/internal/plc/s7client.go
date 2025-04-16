package plc

import (
	"fmt"
	"math" // Para conversão de float32
	"time"

	"github.com/robinson/gos7"
)

// S7Client gerencia uma conexão com um CLP Siemens S7
type S7Client struct {
	client    gos7.Client // Sem asterisco, não é um ponteiro
	plc       *PLC
	handler   *gos7.TCPClientHandler
	conectado bool
}

// NewS7Client cria um novo S7Client
func NewS7Client(plc *PLC) (*S7Client, error) {
	handler := gos7.NewTCPClientHandler(plc.IPAddress, plc.Rack, plc.Slot)
	handler.Timeout = 5 * time.Second
	handler.IdleTimeout = 10 * time.Second

	// Se você precisa usar o gateway, descomente o código abaixo
	/*
		if plc.Gateway != nil {
			handler.Gateway = *plc.Gateway
		}
	*/

	client := gos7.NewClient(handler)

	return &S7Client{
		client:  client,
		plc:     plc,
		handler: handler,
	}, nil
}

// Connect estabelece uma conexão com o CLP
func (s *S7Client) Connect() error {
	// Usar o timeout da configuração
	s.handler.Timeout = Config.ConnectionTimeout
	s.handler.IdleTimeout = Config.ConnectionTimeout * 2

	err := s.handler.Connect()
	if err != nil {
		s.conectado = false
		return fmt.Errorf("falha ao conectar com PLC %s em %s: %v", s.plc.Nome, s.plc.IPAddress, err)
	}
	s.conectado = true
	return nil
}

// Disconnect fecha a conexão com o CLP
func (s *S7Client) Disconnect() error {
	s.conectado = false
	return s.handler.Close()
}

// IsConnected retorna o status da conexão
func (s *S7Client) IsConnected() bool {
	return s.conectado
}

// ReadTag lê uma tag do CLP
func (s *S7Client) ReadTag(tag *Tag) (interface{}, error) {
	if !s.conectado {
		return nil, fmt.Errorf("não conectado ao PLC")
	}

	var buffer []byte
	var result interface{}
	var err error

	switch tag.Tipo {
	case "Bool":
		buffer = make([]byte, 1)
		err = s.client.AGReadDB(tag.DBNumber, tag.ByteOffset, 1, buffer)
		if err != nil {
			return nil, err
		}

		if tag.BitOffset != nil {
			// Extrair o bit
			result = (buffer[0] & (1 << uint(*tag.BitOffset))) > 0
		} else {
			result = buffer[0] > 0
		}

	case "Int":
		buffer = make([]byte, 2)
		err = s.client.AGReadDB(tag.DBNumber, tag.ByteOffset, 2, buffer)
		if err != nil {
			return nil, err
		}
		// Converter os bytes para int16 (big endian)
		result = int16(uint16(buffer[0])<<8 | uint16(buffer[1]))

	case "Word":
		buffer = make([]byte, 2)
		err = s.client.AGReadDB(tag.DBNumber, tag.ByteOffset, 2, buffer)
		if err != nil {
			return nil, err
		}
		// Converter os bytes para uint16 (big endian)
		result = uint16(buffer[0])<<8 | uint16(buffer[1])

	case "Real":
		buffer = make([]byte, 4)
		err = s.client.AGReadDB(tag.DBNumber, tag.ByteOffset, 4, buffer)
		if err != nil {
			return nil, err
		}
		// Converter para float32 usando a função auxiliar
		result = s.byteToFloat32(buffer)

	case "String":
		// Para strings, precisamos ler o comprimento primeiro e depois a string em si
		lengthBuffer := make([]byte, 2)
		err = s.client.AGReadDB(tag.DBNumber, tag.ByteOffset, 2, lengthBuffer)
		if err != nil {
			return nil, err
		}

		maxLength := int(lengthBuffer[0])
		actualLength := int(lengthBuffer[1])

		if actualLength > maxLength {
			actualLength = maxLength
		}

		if actualLength > 0 {
			stringBuffer := make([]byte, actualLength)
			err = s.client.AGReadDB(tag.DBNumber, tag.ByteOffset+2, actualLength, stringBuffer)
			if err != nil {
				return nil, err
			}
			result = string(stringBuffer)
		} else {
			result = ""
		}

	default:
		return nil, fmt.Errorf("tipo de tag não suportado: %s", tag.Tipo)
	}

	return result, nil
}

// WriteTag escreve um valor em uma tag no CLP
func (s *S7Client) WriteTag(tag *Tag, value interface{}) error {
	if !s.conectado {
		return fmt.Errorf("não conectado ao PLC")
	}

	var buffer []byte
	var err error

	switch tag.Tipo {
	case "Bool":
		buffer = make([]byte, 1)

		// Se temos um deslocamento de bit, precisamos ler o valor atual primeiro
		if tag.BitOffset != nil {
			err = s.client.AGReadDB(tag.DBNumber, tag.ByteOffset, 1, buffer)
			if err != nil {
				return err
			}

			if val, ok := value.(bool); ok {
				if val {
					// Setar o bit
					buffer[0] |= (1 << uint(*tag.BitOffset))
				} else {
					// Limpar o bit
					buffer[0] &= ^(1 << uint(*tag.BitOffset))
				}
			} else {
				return fmt.Errorf("valor booleano esperado para tag Bool")
			}
		} else {
			if val, ok := value.(bool); ok {
				if val {
					buffer[0] = 1
				} else {
					buffer[0] = 0
				}
			} else {
				return fmt.Errorf("valor booleano esperado para tag Bool")
			}
		}

		err = s.client.AGWriteDB(tag.DBNumber, tag.ByteOffset, 1, buffer)

	case "Int":
		buffer = make([]byte, 2)
		if val, ok := value.(int); ok {
			// Converter para big endian
			buffer[0] = byte(int16(val) >> 8)
			buffer[1] = byte(int16(val))
		} else if val, ok := value.(int16); ok {
			// Converter para big endian
			buffer[0] = byte(val >> 8)
			buffer[1] = byte(val)
		} else {
			return fmt.Errorf("valor inteiro esperado para tag Int")
		}
		err = s.client.AGWriteDB(tag.DBNumber, tag.ByteOffset, 2, buffer)

	case "Word":
		buffer = make([]byte, 2)
		if val, ok := value.(uint); ok {
			// Converter para big endian
			buffer[0] = byte(uint16(val) >> 8)
			buffer[1] = byte(uint16(val))
		} else if val, ok := value.(uint16); ok {
			// Converter para big endian
			buffer[0] = byte(val >> 8)
			buffer[1] = byte(val)
		} else {
			return fmt.Errorf("valor unsigned esperado para tag Word")
		}
		err = s.client.AGWriteDB(tag.DBNumber, tag.ByteOffset, 2, buffer)

	case "Real":
		buffer = make([]byte, 4)
		if val, ok := value.(float32); ok {
			buffer = s.float32ToByte(val)
		} else if val, ok := value.(float64); ok {
			buffer = s.float32ToByte(float32(val))
		} else {
			return fmt.Errorf("valor float esperado para tag Real")
		}
		err = s.client.AGWriteDB(tag.DBNumber, tag.ByteOffset, 4, buffer)

	case "String":
		if val, ok := value.(string); ok {
			maxLength := tag.Tamanho
			actualLength := len(val)

			if actualLength > maxLength {
				actualLength = maxLength
			}

			buffer = make([]byte, 2+actualLength)
			buffer[0] = byte(maxLength)
			buffer[1] = byte(actualLength)

			copy(buffer[2:], val)

			err = s.client.AGWriteDB(tag.DBNumber, tag.ByteOffset, 2+actualLength, buffer)
		} else {
			return fmt.Errorf("valor string esperado para tag String")
		}

	default:
		return fmt.Errorf("tipo de tag não suportado: %s", tag.Tipo)
	}

	return err
}

// float32ToByte converte float32 para bytes (IEEE 754)
func (s *S7Client) float32ToByte(value float32) []byte {
	bits := math.Float32bits(value)
	bytes := make([]byte, 4)

	// Big endian (Siemens)
	bytes[0] = byte(bits >> 24)
	bytes[1] = byte(bits >> 16)
	bytes[2] = byte(bits >> 8)
	bytes[3] = byte(bits)

	return bytes
}

// byteToFloat32 converte bytes (IEEE 754) para float32
func (s *S7Client) byteToFloat32(bytes []byte) float32 {
	// Big endian (Siemens)
	bits := uint32(bytes[0])<<24 | uint32(bytes[1])<<16 | uint32(bytes[2])<<8 | uint32(bytes[3])
	return math.Float32frombits(bits)
}
